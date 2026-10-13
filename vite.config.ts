import {realpath} from 'node:fs/promises';
import {posix,resolve,relative,isAbsolute,dirname,basename} from 'node:path';
import {defineConfig, type Plugin} from 'vite';
import {boundedFile} from './server/boundary';
import {attachFeed, FeedStore,healthJSON,validateFeedConfig,type FeedConfig} from './server/feed';
// Resolve existing ancestors too: a missing export inside a symlinked directory
// must not become publicly readable when the collector creates it later.
async function canonical(path:string):Promise<string>{
 try{return await realpath(path);}catch(e){
  if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;
  const parent=dirname(path);if(parent===path)throw e;
  return resolve(await canonical(parent),basename(path));
 }
}
export async function rejectServedInputs(inputs:string[],directories:string[]){
 const roots=await Promise.all(directories.map(d=>canonical(resolve(d))));
 for(const input of inputs){
  const paths=[resolve(input),await canonical(resolve(input))];
  for(const root of [...directories.map(d=>resolve(d)),...roots])for(const path of paths){
   const rel=relative(root,path);
   if(rel===''||(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('../')))throw Error('Feed input must be outside served directories');
  }
 }
}
export default defineConfig(async()=>{
 const config:FeedConfig=process.env.AGENT_ISLAND_FEED_CONFIG?validateFeedConfig(await boundedFile(process.env.AGENT_ISLAND_FEED_CONFIG) as FeedConfig):{mode:'unavailable',origins:['http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:4173','http://localhost:4173'],revision:process.env.AGENT_ISLAND_REVISION??'unknown'};
 validateFeedConfig(config);
 const plugin:Plugin={name:'read-only-feed',
  async configResolved(vite){
   await rejectServedInputs([process.env.AGENT_ISLAND_FEED_CONFIG,config.snapshotFile].filter((p):p is string=>!!p),
    [vite.root,resolve(vite.root,vite.build.outDir),...(vite.publicDir?[vite.publicDir]:[]),...vite.server.fs.allow]);
  },
  configureServer(server){if(server.httpServer){const hmr=server.config.server.hmr;
   const hmrPath=typeof hmr==='object'&&hmr.path?posix.join(server.config.base,hmr.path):server.config.base;
   const feed=attachFeed(server.httpServer,new FeedStore(config),10000,req=>{
    try{return hmr!==false && ['vite-hmr','vite-ping'].includes(String(req.headers['sec-websocket-protocol'])) && new URL(req.url??'', 'http://localhost').pathname===hmrPath;}catch{return false;}
   });server.middlewares.use(feed.middleware);}},
  async configurePreviewServer(server){
   const proof=await boundedFile(resolve(server.config.root,server.config.build.outDir,'health.json'));
   if(JSON.stringify(proof)!==healthJSON(config.revision))throw Error('Runtime revision differs from built health proof');
   const feed=attachFeed(server.httpServer,new FeedStore(config));
   server.middlewares.use((req,res,next)=>{
    if(req.url!=='/health'){next();return;}
    res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
    if(req.method!=='GET'){res.statusCode=405;res.end('{"error":"read-only"}');return;}
    if(!process.env.MAO_PROJECT || !process.env.MAO_REVISION){res.statusCode=503;res.end('{"error":"runtime identity unavailable"}');return;}
    res.end(JSON.stringify({project:process.env.MAO_PROJECT,revision:process.env.MAO_REVISION}));
   });
   server.middlewares.use(feed.middleware);},
  generateBundle(){this.emitFile({type:'asset',fileName:'health.json',source:healthJSON(config.revision)});}
 };
 return {plugins:[plugin]};
});
