import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
import type {Snapshot} from '../src/contract';

export const MAX_BYTES = 256 * 1024;
export type SourceStatus = 'ok' | 'unavailable' | 'unauthenticated' | 'timeout' | 'error' | 'invalid' | 'stale' | 'offline';
export interface Feed extends Snapshot { sources: Record<'paseo'|'permits'|'github'|'miniOps', SourceStatus>; heartbeatAt: string | null }
export class SourceError extends Error { constructor(public status:SourceStatus) {super(status);} }
export async function boundedFile(path:string):Promise<unknown> {
 const handle = await open(path, constants.O_RDONLY | constants.O_NONBLOCK | constants.O_NOFOLLOW);
 try {
  if (!(await handle.stat()).isFile() || (await handle.stat()).size > MAX_BYTES) throw new SourceError('invalid');
  const buffer=Buffer.alloc(MAX_BYTES+1); let length=0;
  while(length<buffer.length) {const r=await handle.read(buffer,length,buffer.length-length,null); if(!r.bytesRead) break; length+=r.bytesRead;}
  if(length>MAX_BYTES) throw new SourceError('invalid');
  try{return JSON.parse(buffer.subarray(0,length).toString('utf8'));}catch{throw new SourceError('invalid');}
 } finally {await handle.close();}
}
export function date(v:unknown):string|null { return typeof v==='string' && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString():null; }
export function emptyFeed(repo='agent-island'):Feed {return {schemaVersion:1,project:{id:'agent-island',name:repo},capturedAt:new Date().toISOString(),status:{online:false,stale:true,source:'live'},agents:[],issues:[],previewUrl:null,sources:{paseo:'unavailable',permits:'unavailable',github:'unavailable',miniOps:'unavailable'},heartbeatAt:null};}
