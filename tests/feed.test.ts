import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {Collector,commands,validateConfig,boundedFile,MAX_BYTES,runCommand,commandFailure,type CollectorConfig} from '../server/collector';
import {FeedStore,attachFeed,sanitizeFeed,healthJSON,validateFeedConfig} from '../server/feed';
const now=Date.parse('2026-10-13T15:00:00Z');
const config:CollectorConfig={repo:'alexandruv/agent-island',allowedRepos:['alexandruv/agent-island'],cwd:'/synthetic/project',agents:[{id:'builder',name:'Builder',station:3},{id:'idle',name:'Scout',station:2},{id:'error',name:'Fixer',station:5},{id:'closed',name:'Retired',station:3}]};
const hostile='ghp_FAKE_TEST_SECRET /Users/fake/credentials $(touch /tmp/never) <script>secret</script>';
const agents=[{id:'builder',status:'running',name:hostile,cwd:hostile},{id:'idle',status:'idle'},{id:'error',status:'error'},{id:'closed',status:'archived'},{id:'other-project',status:'running',name:hostile}];
const issues=[{number:10,labels:[{name:'agent:working'},{name:hostile},{name:'merged'}],closedAt:null,title:hostile,body:hostile}];
function mini(heartbeat=now,context:unknown=42){return {projects:{[config.repo]:{heartbeatAt:new Date(heartbeat).toISOString(),agents:[{id:'builder',state:'stuck',contextPercent:context,command:hostile,latestLog:hostile}],credentials:hostile},other:{secret:hostile}},approvals:hostile};}
function collector(permit=true,heartbeat=now,context:unknown=42){return new Collector(config,async(binary,args)=>binary==='gh'?issues:args[0]==='permit'?permit?[{agentId:'builder',description:hostile}]:[]:agents,async()=>mini(heartbeat,context),()=>now);}
test('operator selection and fixed read-only argv; no request or label can change arguments',()=>{
 assert.deepEqual(commands(config),{paseo:['paseo',['ls','--all','--json']],permits:['paseo',['permit','ls','--json']],github:['gh',['issue','list','--repo','alexandruv/agent-island','--state','all','--limit','100','--json','number,labels,closedAt']]});
 assert.throws(()=>validateConfig({...config,repo:'evil/repo'}));
 assert.throws(()=>validateConfig({...config,repo:'--help'}));
 assert.throws(()=>validateConfig({...config,agents:[{id:hostile,name:'X',station:1}]}));
 assert.throws(()=>validateFeedConfig({mode:'sanitized',origins:[],revision:'unknown'}));
});
test('permission priority, working/idle/failed/archive, context and hostile data omission',async()=>{
 const feed=await collector().collect();assert.equal(feed.agents.length,4);
 assert.deepEqual(feed.agents.map(a=>a.state),['waiting-permit','idle','failed','closed']);
 assert.equal(feed.agents[0].contextPercent,42);assert.equal(feed.agents[0].latestLog,null);
 assert.equal(feed.issues[0].mergedAt,null);assert.equal(feed.previewUrl,null);
 assert.deepEqual(feed.issues[0].labels,['agent:working']);
 assert.equal(JSON.stringify(feed).includes('FAKE_TEST_SECRET'),false);assert.equal(JSON.stringify(feed).includes('/Users/'),false);
 assert.equal((await collector(false).collect()).agents[0].state,'stuck');
 for(const context of [-1,101,'88',Infinity,null])assert.equal((await collector(false,now,context).collect()).agents[0].contextPercent,null);
});
test('all independent source failures are visible; successful empty differs from failure',async()=>{
 for(let failure=0;failure<4;failure++){
  let index=0;
  const c=new Collector(config,async()=>{const i=index++;if(i===failure)throw Error(hostile);return [[],[],[]][i];},async()=>{if(failure===3)throw Error(hostile);return mini();},()=>now);
  const feed=await c.collect();assert.equal(Object.values(feed.sources)[failure],'error');assert.equal(feed.status.stale,true);assert.equal(JSON.stringify(feed).includes(hostile),false);
 }
 const c=new Collector(config,async()=>[],async()=>mini(),()=>now);
 const feed=await c.collect();assert.deepEqual(feed.agents,[]);assert.deepEqual(feed.issues,[]);assert.equal(feed.sources.paseo,'ok');assert.equal(feed.status.stale,false);
 const missing=new Collector(config,async()=>{throw Object.assign(Error(hostile),{code:'ENOENT'});},async()=>{throw Error(hostile);},()=>now);
 assert.equal((await missing.collect()).sources.paseo,'unavailable');
});
test('single flight and heartbeat stale/offline transitions',async()=>{
 let calls=0;let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);
 const c=new Collector(config,async()=>{calls++;await gate;return [];},async()=>mini(),()=>now);
 const a=c.collect(),b=c.collect();assert.equal(a,b);release();await a;assert.equal(calls,3);
 const stale=await collector(false,now-31000).collect();assert.equal(stale.sources.miniOps,'stale');assert.equal(stale.status.online,true);
 const offline=await collector(false,now-121000).collect();assert.equal(offline.sources.miniOps,'offline');assert.equal(offline.status.online,false);
 const invalid=new Collector(config,async()=>({unknown:hostile}),async()=>({raw:hostile}),()=>now);
 assert.deepEqual(Object.values((await invalid.collect()).sources),['invalid','invalid','invalid','invalid']);
});
test('bounded file rejects large and growing-compatible inputs without reading real secrets',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'island-fixture-'));
 try{const path=join(dir,'state.json');await writeFile(path,JSON.stringify({secret:hostile,padding:'x'.repeat(MAX_BYTES)}));await assert.rejects(boundedFile(path));await writeFile(path,'[]');assert.deepEqual(await boundedFile(path),[]);}finally{await rm(dir,{recursive:true});}
});
test('sanitized file whitelist, stale cached retention and unavailable/demo provenance',async()=>{
 const live=await collector().collect();
 const safe=sanitizeFeed({...live,private:hostile,agents:live.agents.map(a=>({...a,name:hostile,latestLog:hostile})),issues:live.issues.map(i=>({...i,title:hostile,mergedAt:new Date(now).toISOString()}))},now);
 assert.equal(JSON.stringify(safe).includes('FAKE_TEST_SECRET'),false);assert.equal(safe.issues[0].mergedAt,null);
 let clock=now,fail=false;
 const store=new FeedStore({mode:'sanitized',snapshotFile:'/synthetic/feed.json',origins:[],revision:'unknown'},async()=>{if(fail)throw Error(hostile);return live;},()=>clock);
 await store.refresh();assert.equal(store.snapshot().status.online,true);
 clock+=31000;assert.equal(store.snapshot().status.stale,true);clock+=100000;assert.equal(store.snapshot().status.online,false);
 fail=true;await store.refresh();assert.equal(store.snapshot().status.source,'cache');assert.equal(store.snapshot().agents.length,4);
 const unavailable=new FeedStore({mode:'unavailable',origins:[],revision:'unknown'});await unavailable.refresh();assert.equal(unavailable.snapshot().status.online,false);
 const demo=new FeedStore({mode:'demo',origins:[],revision:'unknown'});await demo.refresh();assert.equal(demo.snapshot().status.source,'demo');
});
test('CLI adapter uses bounded subprocess and maps unauthenticated/unavailable without forwarding stderr',async()=>{
 assert.equal(commandFailure('gh',{code:4}),'unauthenticated');
 assert.equal(commandFailure('paseo',{killed:true}),'timeout');
 assert.equal(commandFailure('paseo',{code:'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'}),'invalid');
 const dir=await mkdtemp(join(tmpdir(),'island-command-'));
 try {const gh=join(dir,'gh');await writeFile(gh,'#!/bin/sh\necho fake-secret >&2\nexit 4\n',{mode:0o700});
 // Use fixed harmless fixture executable; production always uses fixed paseo/gh names.
 await assert.rejects(runCommand('/nonexistent/island',[],dir),(e:any)=>e.status==='unavailable');
 await assert.rejects(runCommand(gh,[],dir),(e:any)=>e.status==='error'&&!e.message.includes('fake-secret'));
 }finally{await rm(dir,{recursive:true});}
});
test('HTTP exact health, initial snapshot, websocket heartbeat/reconnect, origin and inbound rejection',async()=>{
 const store=new FeedStore({mode:'demo',origins:['http://allowed.example'],revision:'a'.repeat(40)});await store.refresh();
 const server=createServer((req,res)=>feed.middleware(req,res,()=>{res.statusCode=404;res.end();}));const feed=attachFeed(server,store,50);
 server.listen(0,'127.0.0.1');await once(server,'listening');const port=(server.address() as {port:number}).port;const base=`http://127.0.0.1:${port}`;
 const connect=()=>new WebSocket(`ws://127.0.0.1:${port}/api/feed`,{origin:'http://allowed.example'});
 try{
  assert.equal(await (await fetch(base+'/health.json')).text(),healthJSON('a'.repeat(40)));
  assert.equal(healthJSON('a'.repeat(40)),`{"status":"ok","revision":"${'a'.repeat(40)}"}`);
  assert.equal((await (await fetch(base+'/api/snapshot')).json()).status.source,'demo');
  assert.equal((await fetch(base+'/api/snapshot',{method:'POST'})).status,405);
  assert.equal((await fetch(base+'/api/snapshot',{headers:{origin:'http://evil.example'}})).status,403);
  for(let i=0;i<2;i++){
   const ws=connect();const messages:any[]=[];ws.on('message',m=>messages.push(JSON.parse(m.toString())));await once(ws,'open');
   await new Promise(resolve=>setTimeout(resolve,90));assert.ok(messages.some(m=>m.type==='snapshot'));assert.ok(messages.some(m=>m.type==='heartbeat'));
   ws.send('approve');const [code]=await once(ws,'close');assert.equal(code,1008);
  }
  const bad=new WebSocket(`ws://127.0.0.1:${port}/api/feed`,{origin:'http://evil.example'});const [error]=await once(bad,'error');assert.match(error.message,/403/);
  for(let i=0;i<7;i++){const ws=connect();await once(ws,'open');ws.close();await once(ws,'close');}
  const limited=connect();const [error2]=await once(limited,'error');assert.match(error2.message,/403/);
 } finally{feed.close();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
test('oversized inbound frame is rejected and missing pong disconnects a dead client',async()=>{
 const store=new FeedStore({mode:'demo',origins:['http://allowed.example'],revision:'unknown'});await store.refresh();
 const server=createServer();const feed=attachFeed(server,store,40);server.listen(0,'127.0.0.1');await once(server,'listening');const port=(server.address() as {port:number}).port;
 try{
  const ws=new WebSocket(`ws://127.0.0.1:${port}/api/feed`,{origin:'http://allowed.example'});await once(ws,'open');ws.send('x'.repeat(2048));const [code]=await once(ws,'close');assert.equal(code,1009);
  const dead=new WebSocket(`ws://127.0.0.1:${port}/api/feed`,{origin:'http://allowed.example',autoPong:false});await once(dead,'open');const [deadCode]=await once(dead,'close');assert.equal(deadCode,1006);
 }finally{feed.close();await new Promise<void>(r=>server.close(()=>r()));}
});
test('collector executes only the allowlisted argv and fixed cwd, missing context remains unknown',async()=>{
 const seen:unknown[]=[];
 const c=new Collector(config,async(binary,args,cwd)=>{seen.push([binary,args,cwd]);return binary==='gh'?issues:args[0]==='permit'?[]:agents;},async()=>({projects:{[config.repo]:{heartbeatAt:new Date(now).toISOString(),agents:[{id:'builder',station:4}]}}}),()=>now);
 const feed=await c.collect();assert.deepEqual(seen,Object.values(commands(config)).map(([binary,args])=>[binary,args,config.cwd]));
 assert.equal(feed.agents[0].contextPercent,null);assert.equal(feed.agents[0].station,4);assert.equal(feed.agents[0].state,'working');
});
test('real subprocess fixtures enforce output and timeout bounds without leaking output',async()=>{
 await assert.rejects(runCommand(process.execPath,['-e',`process.stdout.write('fake-secret'.repeat(${MAX_BYTES}))`],process.cwd()),(e:any)=>e.status==='invalid'&&!e.message.includes('fake-secret'));
 await assert.rejects(runCommand(process.execPath,['-e','setTimeout(()=>{},60000)'],process.cwd()),(e:any)=>e.status==='timeout');
});

 test('hostile and non-string Paseo statuses remain serializable unknown agents',async()=>{
  for(const status of ['constructor','__proto__','toString','hasOwnProperty',{},null,42]){
   const c=new Collector(config,async(binary,args)=>binary==='gh'?[]:args[0]==='permit'?[]:[{id:'builder',status}],async()=>({projects:{[config.repo]:{heartbeatAt:new Date(now).toISOString()}}}),()=>now);
   const feed=await c.collect();assert.equal(feed.sources.paseo,'ok');assert.equal(feed.agents[0].state,'unknown');
   assert.equal(sanitizeFeed(JSON.parse(JSON.stringify(feed)),now).agents[0].state,'unknown');
  }
 });
 test('unmatched upgrades close while explicitly owned development HMR is handed off',async()=>{
  for(const development of [false,true]){
   const store=new FeedStore({mode:'demo',origins:['http://allowed.example'],revision:'unknown'});
   const server=createServer();const feed=attachFeed(server,store,10000,req=>development&&req.url==='/'&&req.headers['sec-websocket-protocol']==='vite-hmr');
   const {WebSocketServer}=await import('ws');const hmr=new WebSocketServer({noServer:true});
   server.on('upgrade',(req,socket,head)=>{if(development&&req.url==='/'&&req.headers['sec-websocket-protocol']==='vite-hmr')hmr.handleUpgrade(req,socket,head,ws=>{ws.close();});});
   server.listen(0,'127.0.0.1');await once(server,'listening');const base=`ws://127.0.0.1:${(server.address() as {port:number}).port}`;
   try{
    for(let i=0;i<35;i++){
     const ws=new WebSocket(base+'/unowned','vite-hmr',{origin:'http://allowed.example',handshakeTimeout:1000});
     const closed=new Promise(resolve=>ws.once('close',resolve));const [error]=await once(ws,'error');assert.doesNotMatch(error.message,/timed out/);await closed;
    }
    const ws=new WebSocket(base+'/','vite-hmr',{origin:'http://allowed.example',handshakeTimeout:1000});
    if(development){await once(ws,'open');await once(ws,'close');}
    else {const closed=new Promise(resolve=>ws.once('close',resolve));const [error]=await once(ws,'error');assert.doesNotMatch(error.message,/timed out/);await closed;}
    const live=new WebSocket(base+'/api/feed',{origin:'http://allowed.example'});await once(live,'open');live.close();await once(live,'close');
   }finally{feed.close();hmr.close();await new Promise<void>(r=>server.close(()=>r()));}
  }
 });
 test('SIGTERM-resistant subprocess is killed at the deadline and single-flight polling recovers',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'island-hard-timeout-'));const pidFile=join(dir,'pid');
  try{
   let calls=0;
   const c=new Collector(config,async(binary,args)=>{
    if(binary==='gh')return [];if(args[0]==='permit')return [];
    calls++;if(calls>1)return [];
    return runCommand(process.execPath,['-e',"process.on('SIGTERM',()=>{});require('node:fs').writeFileSync(process.argv[1],String(process.pid));setInterval(()=>{},1000)",pidFile],dir);
   },async()=>mini(),()=>now);
   const started=Date.now();const first=c.collect();assert.equal(c.collect(),first);
   const feed=await first;assert.equal(feed.sources.paseo,'timeout');assert.ok(Date.now()-started<8000);
   const {readFile}=await import('node:fs/promises');const pid=Number(await readFile(pidFile,'utf8'));
   assert.throws(()=>process.kill(pid,0),(e:any)=>e.code==='ESRCH');
   assert.equal((await c.collect()).sources.paseo,'ok');assert.equal(calls,2);
  }finally{await rm(dir,{recursive:true});}
 });

 test('sanitized agent IDs require strings and reject distinct duplicate arrays',async()=>{
  const live=await collector().collect();const agent=live.agents[0];
  for(const id of [[agent.id],[],{},null,42,true]) {
   assert.throws(()=>sanitizeFeed({...live,agents:[{...agent,id}]},now),/Invalid agent/);
  }
  const first=[agent.id],second=[agent.id];assert.notEqual(first,second);
  assert.throws(()=>sanitizeFeed({...live,agents:[{...agent,id:first},{...agent,id:second}]},now),/Invalid agent/);
  assert.throws(()=>sanitizeFeed({...live,agents:[agent,{...agent}]},now),/Duplicate ID/);
  assert.equal(typeof sanitizeFeed(live,now).agents[0].id,'string');
 });
 test('closed agents move from active stations to Archive after all state resolution',async()=>{
  const project=(rows?:unknown)=>({projects:{[config.repo]:{heartbeatAt:new Date(now).toISOString(),...(rows===undefined?{}:{agents:rows})}}});
  for(const read of [async()=>project(),async()=>project([]),async()=>project([{id:'closed',station:5}]),async()=>({invalid:true}),async()=>{throw Error('fixture failure');}]) {
   const c=new Collector(config,async(binary,args)=>binary==='gh'?[]:args[0]==='permit'?[]:[{id:'closed',status:'archived'}],read,()=>now);
   const feed=await c.collect();assert.equal(feed.agents[0].state,'closed');assert.equal(feed.agents[0].station,'archive');
  }
  const c=new Collector(config,async(binary,args)=>binary==='gh'?[]:args[0]==='permit'?[]:[{id:'builder',status:'running'}],async()=>project([{id:'builder',state:'closed',station:4}]),()=>now);
  assert.equal((await c.collect()).agents[0].station,'archive');
 });

test('Mini Ops failures survive FeedStore freshness, HTTP and WebSocket snapshots',async()=>{
 const {SourceError}=await import('../server/boundary');
 for(const failure of ['unavailable','error','invalid'] as const){
  const c=new Collector(config,async(binary,args)=>binary==='gh'?issues:args[0]==='permit'?[]:agents,
   async()=>{if(failure==='invalid')return {raw:hostile};throw new SourceError(failure);},()=>now);
  const collected=await c.collect();assert.equal(collected.heartbeatAt,null);assert.equal(collected.sources.miniOps,failure);
  let clock=now;
  const store=new FeedStore({mode:'sanitized',snapshotFile:'/synthetic/feed.json',origins:['http://allowed.example'],revision:'unknown'},async()=>collected,()=>clock);
  await store.refresh();
  for(const age of [0,31000,121000]){clock=now+age;assert.equal(store.snapshot().sources.miniOps,failure);assert.equal(store.snapshot().status.online,false);assert.equal(store.snapshot().status.stale,true);}
  const server=createServer((req,res)=>feed.middleware(req,res,()=>{res.statusCode=404;res.end();}));const feed=attachFeed(server,store);
  server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
  try{
   const served=await (await fetch(base+'/api/snapshot')).json();assert.equal(served.sources.miniOps,failure);assert.equal(JSON.stringify(served).includes(hostile),false);
   const ws=new WebSocket(base.replace('http:','ws:')+'/api/feed',{origin:'http://allowed.example'});
   const [body]=await once(ws,'message');assert.equal(JSON.parse(body.toString()).snapshot.sources.miniOps,failure);ws.close();await once(ws,'close');
  }finally{feed.close();await new Promise<void>(r=>server.close(()=>r()));}
 }
});
