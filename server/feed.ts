import type {IncomingMessage, ServerResponse} from 'node:http';
import {WebSocketServer, WebSocket} from 'ws';
import {boundedFile, date, emptyFeed, type Feed, type SourceStatus} from './boundary';
import {demo} from '../src/fixture';

export interface FeedConfig {mode:'unavailable'|'demo'|'sanitized'; snapshotFile?:string; origins:string[]; revision:string}
export function validateFeedConfig(c:FeedConfig):FeedConfig {
 if(!c || !['unavailable','demo','sanitized'].includes(c.mode) || !Array.isArray(c.origins) || c.origins.length>10 || c.origins.some(o=>{try{return new URL(o).origin!==o;}catch{return true;}}) || !/^(unknown|[a-f0-9]{40})$/.test(c.revision) || (c.mode==='sanitized'&&!c.snapshotFile?.startsWith('/'))) throw Error('Invalid feed configuration');
 return c;
}
const sourceStates=new Set<SourceStatus>(['ok','unavailable','unauthenticated','timeout','error','invalid','stale','offline']);
const agentStates=new Set(['working','idle','waiting-permit','failed','stuck','needs-human','closed','unknown']);
const allowedLabels=new Set(['agent:queued','agent:working','agent:under-review','agent:reworking','agent:ready-for-human','agent:needs-human']);
// Reconstruct every field. An operator file is not allowed to smuggle raw data onto public routes.
export function sanitizeFeed(v:unknown, now=Date.now()):Feed {
 const s=v as Feed;
 if(!s || s.schemaVersion!==1 || !date(s.capturedAt) || !Array.isArray(s.agents) || s.agents.length>100 || !Array.isArray(s.issues)||s.issues.length>100 || !s.sources || !s.status || s.status.source!=='live') throw Error('Invalid snapshot');
 const sources=Object.fromEntries(['paseo','permits','github','miniOps'].map(key=>{
  const value=s.sources[key as keyof typeof s.sources]; if(!sourceStates.has(value)) throw Error('Invalid source'); return [key,value];
 })) as Feed['sources'];
 const feed:Feed={...emptyFeed(),capturedAt:date(s.capturedAt)!,heartbeatAt:date(s.heartbeatAt),sources,
  agents:s.agents.map((a,n)=>{
   if(typeof a.id!=='string' || !/^agent-[a-f0-9]{32}$/.test(a.id) || !agentStates.has(a.state)||![1,2,3,4,5,6,7,'archive'].includes(a.station)) throw Error('Invalid agent');
   return {id:a.id,name:`Agent ${n+1}`,station:a.station,state:a.state,contextPercent:typeof a.contextPercent==='number'&&Number.isFinite(a.contextPercent)&&a.contextPercent>=0&&a.contextPercent<=100?a.contextPercent:null,latestLog:null};
  }),issues:s.issues.map(i=>{
   if(!Number.isSafeInteger(i.number)||i.number<1||!Array.isArray(i.labels)) throw Error('Invalid issue');
   return {id:`issue-${i.number}`,number:i.number,title:`Issue #${i.number}`,labels:[...new Set(i.labels.filter(l=>allowedLabels.has(l)))],authorizedPendingClaim:false,closedAt:date(i.closedAt),mergedAt:null,previewReadyAt:null};
  }),previewUrl:null};
 if(new Set([...feed.agents,...feed.issues].map(x=>x.id)).size!==feed.agents.length+feed.issues.length) throw Error('Duplicate ID');
 return freshness(feed,now,s.status.online===true,s.status.stale!==false);
}
function freshness(feed:Feed,now:number,online=feed.status.online,stale=feed.status.stale):Feed {
 feed={...feed,sources:{...feed.sources}};
 const age=now-Date.parse(feed.capturedAt);
 if(age < -5000) throw Error('Future snapshot');
 const heartbeatAge=feed.heartbeatAt?now-Date.parse(feed.heartbeatAt):Infinity;
 if(heartbeatAge < -5000) throw Error('Future heartbeat');
 feed.status={source:'live',online:online&&age<=120000&&heartbeatAge<=120000,stale:stale||age>30000||heartbeatAge>30000||Object.values(feed.sources).some(x=>x!=='ok')};
 // Freshness refines heartbeat health; it must not erase a source failure.
 if(['ok','stale','offline'].includes(feed.sources.miniOps)){
  if(age>120000||heartbeatAge>120000) feed.sources.miniOps='offline';
  else if(age>30000||heartbeatAge>30000) feed.sources.miniOps='stale';
 }
 return feed;
}
export class FeedStore {
 private value:Feed=emptyFeed(); private pending:Promise<void>|null=null;
 constructor(readonly config:FeedConfig,private read=boundedFile,private now=()=>Date.now()){validateFeedConfig(config);}
 refresh():Promise<void> {
  if(this.pending)return this.pending;
  this.pending=this.load().finally(()=>{this.pending=null;}); return this.pending;
 }
 private async load() {
  if(this.config.mode==='demo'){this.value={...demo,capturedAt:new Date(this.now()).toISOString(),sources:{paseo:'unavailable',permits:'unavailable',github:'unavailable',miniOps:'unavailable'},heartbeatAt:null};return;}
  if(this.config.mode==='unavailable'){this.value=emptyFeed();return;}
  try{this.value=sanitizeFeed(await this.read(this.config.snapshotFile!),this.now());}
  catch{this.value={...this.value,status:{source:'cache',online:false,stale:true},sources:{paseo:'unavailable',permits:'unavailable',github:'unavailable',miniOps:'unavailable'}};}
 }
 snapshot():Feed {
  if(this.config.mode==='sanitized'&&this.value.status.source==='live')return freshness(this.value,this.now());
  return this.value;
 }
}
export function healthJSON(revision:string) {return JSON.stringify({status:'ok',revision});}
export function attachFeed(server:import('node:events').EventEmitter,store:FeedStore, heartbeatMs=10000, ownsDevelopmentUpgrade:(req:IncomingMessage)=>boolean=()=>false) {
 const wss=new WebSocketServer({noServer:true,maxPayload:1024,perMessageDeflate:false});
 wss.on('error',()=>{});
 const attempts=new Map<string,{count:number;until:number}>();
 let refreshing=false;
 const tick=async()=>{if(refreshing)return;refreshing=true;try{await store.refresh();const msg=JSON.stringify({type:'snapshot',snapshot:store.snapshot()});for(const ws of wss.clients) {if(ws.bufferedAmount>256*1024){ws.terminate();continue;} ws.send(msg);}}finally{refreshing=false;}};
 const timer=setInterval(()=>{void tick(); for(const ws of wss.clients) {
  const client=ws as WebSocket & {alive?:boolean}; if(client.alive===false){client.terminate();continue;}client.alive=false;client.ping();
  client.send(JSON.stringify({type:'heartbeat',at:new Date().toISOString()}));
 }},heartbeatMs); timer.unref();
 const upgrade=(req:IncomingMessage,socket:import('node:stream').Duplex,head:Buffer)=>{
  if(req.url!=='/api/feed' && ownsDevelopmentUpgrade(req))return;
  const reject=()=>{socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();};
  if(req.url!=='/api/feed'){reject();return;}
  const ip=req.socket.remoteAddress??'unknown',now=Date.now();
  for(const [key,value] of attempts)if(value.until<now)attempts.delete(key);
  const attempt=attempts.get(ip)??{count:0,until:now+60000};
  if(attempts.size>=128&&!attempts.has(ip)){reject();return;}
  attempts.set(ip,attempt);attempt.count++;
  if(attempt.count>10 || wss.clients.size>=32 || !store.config.origins.includes(req.headers.origin??'') || req.method!=='GET'){reject();return;}
  wss.handleUpgrade(req,socket,head,ws=>{
   const client=ws as WebSocket & {alive?:boolean};client.alive=true;
   ws.on('pong',()=>{client.alive=true;});ws.on('error',()=>ws.terminate());
   ws.on('message',()=>ws.close(1008,'Read-only feed'));
   ws.send(JSON.stringify({type:'snapshot',snapshot:store.snapshot()}));
  });
 };
 server.on('upgrade',upgrade);
 const middleware=(req:IncomingMessage,res:ServerResponse,next:()=>void)=>{
  if(req.url!=='/api/snapshot'&&req.url!=='/health.json'){next();return;}
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET'){res.statusCode=405;res.end('{"error":"read-only"}');return;}
  if(req.headers.origin&&!store.config.origins.includes(req.headers.origin)){res.statusCode=403;res.end('{"error":"forbidden"}');return;}
  res.end(req.url==='/health.json'?healthJSON(store.config.revision):JSON.stringify(store.snapshot()));
 };
 void tick();
 const close=()=>{clearInterval(timer);server.off('upgrade',upgrade);for(const ws of wss.clients)ws.terminate();wss.close();};
 server.once('close',close);
 return {middleware,close};
}
