import { demo } from './fixture';
import type { Snapshot } from './contract';

export const retryDelay = (attempt: number, random = Math.random()) => Math.min(60000, Math.min(30000, 1000 * 2 ** Math.min(attempt, 5)) * (1 + random));
/** Transport heartbeat cannot renew source freshness. All failed reads retain cached entities. */
export function staleSnapshot(s: Snapshot): Snapshot {
 return {...s, status:{source:s.status.source === 'demo' ? 'demo' : 'cache', online:false, stale:true}};
}
export function freshSnapshot(s: Snapshot, receivedAt: number, now: number): Snapshot {
 if(s.status.source === 'demo') return now-receivedAt > 30000 ? staleSnapshot(s) : s;
 const extended=s as Snapshot & {heartbeatAt?:string|null; sources?:Record<string,string>};
 const age=now-Date.parse(s.capturedAt), heartbeat=extended.heartbeatAt ? now-Date.parse(extended.heartbeatAt) : Infinity;
 const offline=now-receivedAt>30000 || age>120000 || heartbeat>120000;
 return {...s,status:{...s.status,online:s.status.online&&!offline,stale:s.status.stale||offline||age>30000||heartbeat>30000||Object.values(extended.sources??{}).some(v=>v!=='ok')}};
}
export function parseSnapshot(v: unknown): Snapshot {
 const s=v as Snapshot;
 if(!s || s.schemaVersion!==1 || !s.status || !['live','cache','demo'].includes(s.status.source) || typeof s.status.online!=='boolean'||typeof s.status.stale!=='boolean'||!Number.isFinite(Date.parse(s.capturedAt))||!Array.isArray(s.agents)||!Array.isArray(s.issues)||s.agents.length>100||s.issues.length>100) throw Error('Invalid feed');
 const states=['working','idle','waiting-permit','failed','stuck','needs-human','closed','unknown'];
 for(const a of s.agents) if(!a||typeof a.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(a.id)||typeof a.name!=='string'||!states.includes(a.state)||![1,2,3,4,5,6,7,'archive'].includes(a.station)||(a.latestLog!==null&&(typeof a.latestLog!=='string'||a.latestLog.length>512))) throw Error('Invalid agent');
 for(const i of s.issues) if(!i||typeof i.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(i.id)||!Number.isSafeInteger(i.number)||typeof i.title!=='string'||!Array.isArray(i.labels)||i.labels.some(l=>typeof l!=='string')) throw Error('Invalid issue');
 if(new Set([...s.agents,...s.issues].map(e=>e.id)).size!==s.agents.length+s.issues.length) throw Error('Duplicate ID');
 return s;
}
export function selectedDetails(s:Snapshot,id:string):{title:string;agent?:Snapshot['agents'][number];issue?:Snapshot['issues'][number]}|null {
 const agent=s.agents.find(a=>a.id===id);if(agent)return {title:agent.name,agent};
 const issue=s.issues.find(i=>i.id===id);return issue?{title:`#${issue.number} ${issue.title}`,issue}:null;
}
export function connectFeed(update:(s:Snapshot)=>void, location:Pick<Location,'protocol'|'host'>=window.location) {
 let value:Snapshot={schemaVersion:1,project:{id:'agent-island',name:'Agent Island'},capturedAt:new Date().toISOString(),status:{source:'live',online:false,stale:true},agents:[],issues:[],previewUrl:null},received=0,attempt=0,socket:WebSocket|null=null,timer:ReturnType<typeof setTimeout>|undefined,stopped=false;
 const publish=()=>update(freshSnapshot(value,received,Date.now()));
 const fail=()=>{value=staleSnapshot(value);publish();};
 const accept=(raw:unknown)=>{value=parseSnapshot(raw);received=Date.now();publish();};
 const connect=()=>{
  if(stopped)return;
  socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/api/feed`);
  const current=socket;const started=Date.now();
  const handshake=setTimeout(()=>{fail();current.close();},15000);
  current.onmessage=e=>{try{const msg=JSON.parse(e.data);if(msg.type==='snapshot'){accept(msg.snapshot);clearTimeout(handshake);}}catch{fail();current.close();}};
  current.onerror=()=>{fail();current.close();};
  current.onclose=()=>{clearTimeout(handshake);if(stopped)return;fail();if(Date.now()-started>=60000)attempt=0;timer=setTimeout(connect,retryDelay(attempt++));};
 };
 // Static hosting has no API: an absent route explicitly falls back to DEMO.
 const abort=new AbortController();const deadline=setTimeout(()=>abort.abort(),5000);
 void fetch('/api/snapshot',{signal:abort.signal,cache:'no-store'}).then(async r=>{if(r.status===404 || (r.ok && !r.headers.get('content-type')?.includes('application/json'))){value=demo;received=Date.now();publish();return;}if(!r.ok)throw Error('Feed unavailable');accept(await r.json());}).catch(fail).finally(()=>{clearTimeout(deadline);connect();});
 let published='';
 const expiry=setInterval(()=>{if(received && Date.now()-received>30000 && socket?.readyState===WebSocket.OPEN){fail();socket.close();}const next=JSON.stringify(freshSnapshot(value,received,Date.now()));if(next!==published){published=next;publish();}},1000);
 return ()=>{stopped=true;abort.abort();clearTimeout(deadline);clearTimeout(timer);clearInterval(expiry);socket?.close();};
}
