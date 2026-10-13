import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {demo} from '../src/fixture';
import {retryDelay,staleSnapshot,freshSnapshot,parseSnapshot,selectedDetails} from '../src/live-feed';
import {createIslandScene} from '../src/scene';
const now=Date.now();
const live=()=>({...structuredClone(demo),capturedAt:new Date(now).toISOString(),heartbeatAt:new Date(now).toISOString(),sources:{paseo:'ok',miniOps:'ok',github:'ok',permits:'ok'},status:{source:'live' as const,online:true,stale:false}});
test('disconnect retains IDs and marks cache offline; source freshness never renewed by transport',()=>{
 const s=live();assert.equal(staleSnapshot(s).status.online,false);assert.equal(staleSnapshot(s).agents,s.agents);
 assert.equal(freshSnapshot(s,now,now+30001).status.online,false);
 assert.equal(freshSnapshot(s,now+40000,now+40000).status.stale,true);
 assert.equal(freshSnapshot(s,now+121000,now+121000).status.online,false);
 s.sources.permits='error';assert.equal(freshSnapshot(s,now,now).status.stale,true);
 s.status.online=false;assert.equal(freshSnapshot(s,now,now).status.online,false);
});
test('retries remain bounded and do not exceed connection budget during failures',()=>{
 assert.deepEqual([0,1,2,3,4,5,20].map(n=>retryDelay(n,0)),[1000,2000,4000,8000,16000,30000,30000]);
 assert.equal(retryDelay(100,1),60000);
 let time=0,count=0;while(time<60000){time+=retryDelay(count++,0);}assert.ok(count<=10);
});
test('selection survives movement and archive, removal stays unknown; duplicates rejected',()=>{
 const s=live(),id=s.agents[0].id;s.agents[0].station=5;assert.equal(selectedDetails(s,id)?.agent?.station,5);
 s.agents[0].station='archive';s.agents[0].state='closed';assert.equal(selectedDetails(s,id)?.agent?.state,'closed');
 s.agents=[];assert.equal(selectedDetails(s,id),null);
 const bad=live();bad.agents.push(bad.agents[0]);assert.throws(()=>parseSnapshot(bad),/Duplicate/);
 assert.equal(parseSnapshot(live()).status.source,'live');
});
test('island accepts empty stations and multiple agents, moves identities without duplicates',()=>{
 const s=live();s.agents=s.agents.slice(0,2);s.agents.forEach(a=>a.station=5);
 const first=createIslandScene(()=>s,()=>new T.SpriteMaterial());assert.equal(first.robots.length,2);assert.notDeepEqual(first.robots[0].position,first.robots[1].position);
 s.agents[0].station='archive';const next=createIslandScene(()=>s,()=>new T.SpriteMaterial());assert.equal(next.robots[0].userData.entityId,s.agents[0].id);assert.ok(next.robots[0].position.x< -8);
 s.agents=[];s.issues=[];assert.equal(createIslandScene(()=>s,()=>new T.SpriteMaterial()).robots.length,0);
});

test('client reconnect resumes snapshots, caches failures, and closes silent peers without reload',async t=>{
 const {connectFeed}=await import('../src/live-feed');
 const originalFetch=globalThis.fetch, originalSocket=globalThis.WebSocket;
 class FakeSocket {
  static OPEN=1;static instances:FakeSocket[]=[];readyState=1;
  onmessage:((e:{data:string})=>void)|null=null;onerror:(()=>void)|null=null;onclose:(()=>void)|null=null;
  constructor(public url:string){FakeSocket.instances.push(this);}
  close(){if(this.readyState===3)return;this.readyState=3;this.onclose?.();}
  sendSnapshot(s:unknown){this.onmessage?.({data:JSON.stringify({type:'snapshot',snapshot:s})});}
 }
 t.mock.timers.enable({apis:['Date','setTimeout','setInterval'],now});
 globalThis.fetch=(async()=>new Response(JSON.stringify(live()),{headers:{'content-type':'application/json'}})) as typeof fetch;
 globalThis.WebSocket=FakeSocket as unknown as typeof WebSocket;
 const values:import('../src/contract').Snapshot[]=[];
 let stop:(()=>void)|undefined;
 try{
  stop=connectFeed(s=>values.push(s),{protocol:'https:',host:'island.example'});
  for(let i=0;i<20;i++)await Promise.resolve();
  assert.equal(FakeSocket.instances.length,1);assert.equal(FakeSocket.instances[0].url,'wss://island.example/api/feed');
  const first=FakeSocket.instances[0];first.sendSnapshot(live());first.close();assert.equal(values.at(-1)?.status.online,false);assert.equal(values.at(-1)?.agents[0].id,demo.agents[0].id);
  t.mock.timers.tick(2000);assert.equal(FakeSocket.instances.length,2);
  const changed=live();changed.agents[0].station=5;FakeSocket.instances[1].sendSnapshot(changed);
  assert.equal(values.at(-1)?.status.online,true);assert.equal(values.at(-1)?.agents[0].station,5);
  t.mock.timers.tick(31001);assert.equal(FakeSocket.instances[1].readyState,3);assert.equal(values.at(-1)?.status.online,false);
  stop();const count=FakeSocket.instances.length;t.mock.timers.tick(120000);assert.equal(FakeSocket.instances.length,count);
 }finally{stop?.();globalThis.fetch=originalFetch;globalThis.WebSocket=originalSocket;t.mock.timers.reset();}
});
