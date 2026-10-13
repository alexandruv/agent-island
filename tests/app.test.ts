import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {WebSocket} from 'ws';

test('built Vite preview runs synthetic HTTP/WebSocket without ambient credentials',async()=>{
 const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=(reservation.address() as {port:number}).port;await new Promise<void>(r=>reservation.close(()=>r()));
 const dir=await mkdtemp(join(tmpdir(),'island-preview-'));const config=join(dir,'feed.json');const origin=`http://127.0.0.1:${port}`;
 await writeFile(config,JSON.stringify({mode:'demo',origins:[origin],revision:'unknown'}));
 const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort','--configLoader','runner'],{cwd:resolve('.'),env:{PATH:process.env.PATH,AGENT_ISLAND_FEED_CONFIG:config},stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',b=>{output=(output+b).slice(-16384);});child.stderr.on('data',b=>{output=(output+b).slice(-16384);});
 try{
  const deadline=Date.now()+10000;
  while(!output.includes(origin)){if(child.exitCode!==null||Date.now()>deadline)throw Error('Preview startup failed: '+output);await new Promise(r=>setTimeout(r,20));}
  assert.match(await (await fetch(origin)).text(),/assets\/index-/);
  assert.equal(await (await fetch(origin+'/health.json')).text(),await readFile('dist/health.json','utf8'));
  const response=await (await fetch(origin+'/api/snapshot')).json();assert.equal(response.status.source,'demo');assert.equal(response.agents[0].id,'demo-robot-1');
  for(const path of ['/unowned','/']){
   const rejected=new WebSocket(origin.replace('http:','ws:')+path,'vite-hmr',{origin,handshakeTimeout:1000});
   const closed=new Promise(resolve=>rejected.once('close',resolve));const [error]=await once(rejected,'error');assert.doesNotMatch(error.message,/timed out/);await closed;
  }
  const ws=new WebSocket(origin.replace('http:','ws:')+'/api/feed',{origin});const message=once(ws,'message');const [body]=await message;assert.equal(JSON.parse(body.toString()).snapshot.status.source,'demo');ws.close();await once(ws,'close');
 }finally{const exit=once(child,'exit');child.kill('SIGTERM');await exit;await rm(dir,{recursive:true});}
});

test('preview rejects private inputs in served directories and sanitizes external hostile files over HTTP',async()=>{
 const {emptyFeed}=await import('../server/boundary');
 const {symlink}=await import('node:fs/promises');
 const dir=await mkdtemp(join(tmpdir(),'island-private-'));
 const hostile='ghp_FAKE_TEST_SECRET /Users/fake/private logs';
 const snapshot={...emptyFeed(),private:hostile,logs:hostile};
 const local=await mkdtemp(resolve('dist/private-input-'));const alias=join(dir,'served-alias');
 await symlink(local,alias);await writeFile(join(local,'feed.json'),JSON.stringify(snapshot));
 const config=join(dir,'config.json');
 const run=async(snapshotFile:string,configPath=config,reject=false)=>{
  const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=(reservation.address() as {port:number}).port;await new Promise<void>(r=>reservation.close(()=>r()));
  const origin=`http://127.0.0.1:${port}`;
  await writeFile(configPath,JSON.stringify({mode:'sanitized',snapshotFile,origins:[origin],revision:'unknown',private:hostile}));
  const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort','--configLoader','runner'],{cwd:resolve('.'),env:{PATH:process.env.PATH,AGENT_ISLAND_FEED_CONFIG:configPath},stdio:['ignore','pipe','pipe']});
  let output='';child.stdout.on('data',b=>{output=(output+b).slice(-16384);});child.stderr.on('data',b=>{output=(output+b).slice(-16384);});
  const exited=once(child,'exit');
  try{
   const deadline=Date.now()+10000;
   while(child.exitCode===null&&!output.includes(origin)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));
   if(reject){assert.notEqual(child.exitCode,null,output);assert.notEqual(child.exitCode,0);assert.match(output,/Feed input must be outside served directories/);assert.equal(output.includes(hostile),false);await assert.rejects(fetch(origin+'/feed.json'));return;}
   assert.equal(child.exitCode,null,output);assert.ok(output.includes(origin),output);
   const response=await (await fetch(origin+'/api/snapshot')).text();assert.equal(JSON.parse(response).sources.miniOps,'unavailable');assert.equal(response.includes(hostile),false);
   for(const path of ['/feed.json','/config.json','/@fs'+snapshotFile])assert.equal((await (await fetch(origin+path)).text()).includes(hostile),false);
   assert.equal((await fetch(origin+'/api/snapshot',{headers:{origin:'http://evil.example'}})).status,403);
  }finally{if(child.exitCode===null)child.kill('SIGTERM');await exited;}
 };
 try{
  await run(join(local,'feed.json'),config,true);
  await run(join(alias,'feed.json'),config,true);
  await run(join(alias,'not-yet-created.json'),config,true);
  await run(join(dir,'feed.json'),join(local,'config.json'),true);
  await writeFile(join(dir,'feed.json'),JSON.stringify(snapshot));await run(join(dir,'feed.json'));
 }finally{await rm(local,{recursive:true});await rm(dir,{recursive:true});}
});
