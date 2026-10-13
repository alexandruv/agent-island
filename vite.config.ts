import {resolve} from 'node:path';
import {defineConfig, type Plugin} from 'vite';
import {boundedFile} from './server/boundary';
import {attachFeed, FeedStore,healthJSON,validateFeedConfig,type FeedConfig} from './server/feed';
export default defineConfig(async()=>{
 const config:FeedConfig=process.env.AGENT_ISLAND_FEED_CONFIG?validateFeedConfig(await boundedFile(process.env.AGENT_ISLAND_FEED_CONFIG) as FeedConfig):{mode:'unavailable',origins:['http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:4173','http://localhost:4173'],revision:process.env.AGENT_ISLAND_REVISION??'unknown'};
 validateFeedConfig(config);
 const plugin:Plugin={name:'read-only-feed',
  configureServer(server){if(server.httpServer){const feed=attachFeed(server.httpServer,new FeedStore(config));server.middlewares.use(feed.middleware);}},
  async configurePreviewServer(server){
   const proof=await boundedFile(resolve(server.config.root,server.config.build.outDir,'health.json'));
   if(JSON.stringify(proof)!==healthJSON(config.revision))throw Error('Runtime revision differs from built health proof');
   const feed=attachFeed(server.httpServer,new FeedStore(config));server.middlewares.use(feed.middleware);},
  generateBundle(){this.emitFile({type:'asset',fileName:'health.json',source:healthJSON(config.revision)});}
 };
 return {plugins:[plugin]};
});
