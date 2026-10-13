import {MAX_BYTES, SourceError, boundedFile, date, emptyFeed, type Feed, type SourceStatus} from './boundary';
export {MAX_BYTES,boundedFile,date,emptyFeed,type Feed,type SourceStatus} from './boundary';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import type {AgentState, Station} from '../src/contract';

export const agentId=(id:string)=>`agent-${createHash('sha256').update(id).digest('hex').slice(0,32)}`;
export interface CollectorConfig { repo: string; allowedRepos: string[]; cwd: string; agents: {id:string; name:string; station:Station}[] }
export function validateConfig(c: CollectorConfig) {
 if (!c || !/^[\w.-]+\/[\w.-]+$/.test(c.repo) || !Array.isArray(c.allowedRepos) || !c.allowedRepos.includes(c.repo) || !c.cwd?.startsWith('/') || !Array.isArray(c.agents) || c.agents.length > 100) throw Error('Invalid operator configuration');
 const ids = new Set<string>();
 for (const a of c.agents) {
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(a.id) || ids.has(a.id) || !/^[a-zA-Z0-9 _-]{1,40}$/.test(a.name) || ![1,2,3,4,5,6,7,'archive'].includes(a.station)) throw Error('Invalid agent allowlist');
  ids.add(a.id);
 }
 return c;
}
export function commands(c: CollectorConfig) {
 validateConfig(c);
 return {paseo:['paseo', ['ls','--all','--json']], permits:['paseo',['permit','ls','--json']], github:['gh',['issue','list','--repo',c.repo,'--state','all','--limit','100','--json','number,labels,closedAt']] } as const;
}
export function commandFailure(binary:string, e:{code?:string|number;killed?:boolean}):SourceStatus {return e.code==='ENOENT'?'unavailable':e.code==='ERR_CHILD_PROCESS_STDIO_MAXBUFFER'?'invalid':e.killed?'timeout':binary==='gh'&&e.code===4?'unauthenticated':'error';}
export function runCommand(binary:string, args:readonly string[], cwd:string):Promise<unknown> {
 return new Promise((resolve,reject)=>execFile(binary,[...args],{cwd,timeout:5000,killSignal:'SIGKILL',maxBuffer:MAX_BYTES,encoding:'utf8',shell:false},(err,stdout)=>{
  if(err) { const e=err as typeof err & {code?:string|number;killed?:boolean}; reject(new SourceError(commandFailure(binary,e))); return; }
  try {resolve(JSON.parse(stdout));} catch {reject(new SourceError('invalid'));}
 }));
}
function paseoState(status:unknown):AgentState {
 switch(status) {case 'running':return 'working';case 'idle':return 'idle';case 'error':return 'failed';case 'archived':return 'closed';default:return 'unknown';}
}
const labels = new Set(['agent:queued','agent:working','agent:under-review','agent:reworking','agent:ready-for-human','agent:needs-human']);
const states = new Set<AgentState>(['working','idle','waiting-permit','failed','stuck','needs-human','closed','unknown']);
const record=(v:unknown):Record<string,unknown> => {if(!v || typeof v!=='object' || Array.isArray(v)) throw new SourceError('invalid'); return v as Record<string,unknown>;};
function list(v:unknown):Record<string,unknown>[] {if(!Array.isArray(v)||v.length>1000) throw new SourceError('invalid'); return v.map(record);}
export class Collector {
 private pending:Promise<Feed>|null=null;
 constructor(readonly config:CollectorConfig, private run=runCommand, private read:()=>Promise<unknown>=()=>boundedFile('/Users/dev/.mini-ops/state.json'), private now=()=>Date.now()) {validateConfig(config);}
 collect():Promise<Feed> {if(this.pending) return this.pending; this.pending=this.poll().finally(()=>{this.pending=null;}); return this.pending;}
 private async poll():Promise<Feed> {
  const feed=emptyFeed(this.config.repo); feed.capturedAt=new Date(this.now()).toISOString();
  const argv=commands(this.config);
  const result=await Promise.allSettled([this.run(...argv.paseo,this.config.cwd),this.run(...argv.permits,this.config.cwd),this.run(...argv.github,this.config.cwd),this.read()]);
  const values:unknown[]=[];
  const names=['paseo','permits','github','miniOps'] as const;
  result.forEach((r,i)=>{feed.sources[names[i]]=r.status==='fulfilled'?'ok':r.reason instanceof SourceError?r.reason.status:r.reason?.code==='ENOENT'?'unavailable':'error'; values[i]=r.status==='fulfilled'?r.value:undefined;});
  // All host strings (names, paths, descriptions, titles, logs, commands) are deliberately omitted.
  const parse=(i:number,fn:()=>void)=>{if(feed.sources[names[i]]==='ok') try{fn();}catch{feed.sources[names[i]]='invalid';}};
  parse(0,()=>{feed.agents=list(values[0]).filter(a=>this.config.agents.some(x=>x.id===a.id)).map(a=>{
   const alias=this.config.agents.find(x=>x.id===a.id)!;
   return {id:agentId(alias.id),name:alias.name,station:alias.station,state:paseoState(a.status),contextPercent:null,latestLog:null};
  });});
  parse(1,()=>{const permits=list(values[1]); for(const a of feed.agents) if(permits.some(p=>typeof p.agentId==='string'&&agentId(p.agentId)===a.id)) a.state='waiting-permit';});
  parse(2,()=>{feed.issues=list(values[2]).slice(0,100).map(i=>{
   if(!Number.isSafeInteger(i.number)||Number(i.number)<1||!Array.isArray(i.labels)) throw new SourceError('invalid');
   return {id:`issue-${i.number}`,number:Number(i.number),title:`Issue #${i.number}`,labels:[...new Set(i.labels.map(l=>record(l).name).filter((l):l is string=>typeof l==='string'&&labels.has(l)))],authorizedPendingClaim:false,mergedAt:null,previewReadyAt:null,closedAt:date(i.closedAt)};
  });});
  // Mini Ops schema v1 is an explicit operator adapter, never raw orchestrator state.
  parse(3,()=>{const m=record(values[3]); const projects=record(m.projects); const project=record(projects[this.config.repo]);
   feed.heartbeatAt=date(project.heartbeatAt);
   if(!feed.heartbeatAt) throw new SourceError('invalid');
   const age=this.now()-Date.parse(feed.heartbeatAt);
   if(age < -5000) throw new SourceError('invalid');
   feed.sources.miniOps=age>120000?'offline':age>30000?'stale':'ok';
   if(project.agents!==undefined) for(const row of list(project.agents)) {
    const a=feed.agents.find(a=>typeof row.id==='string'&&a.id===agentId(row.id)); if(!a) continue;
    if(states.has(row.state as AgentState) && a.state!=='waiting-permit') a.state=row.state as AgentState;
    if([1,2,3,4,5,6,7,'archive'].includes(row.station as Station)) a.station=row.station as Station;
    if(a.state==='closed') a.station='archive';
    a.contextPercent=typeof row.contextPercent==='number'&&Number.isFinite(row.contextPercent)&&row.contextPercent>=0&&row.contextPercent<=100?row.contextPercent:null;
   }
  });
  feed.status={source:'live',online:feed.sources.paseo==='ok'&&['ok','stale'].includes(feed.sources.miniOps),stale:Object.values(feed.sources).some(s=>s!=='ok')};
  return feed;
 }
}
