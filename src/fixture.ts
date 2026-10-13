import type { Snapshot, AgentState } from './contract';
export const demo: Snapshot = {
 schemaVersion:1, project:{id:'agent-island-demo',name:'Agent Island'}, capturedAt:'2026-10-13T12:00:00Z',
 status:{online:true,stale:false,source:'demo'}, previewUrl:null,
 agents: (['working','idle','waiting-permit','needs-human','failed','stuck','unknown','closed'] as AgentState[]).map((state,n)=>({id:`demo-robot-${n+1}`,name:['Dockhand','Scout','Builder','Reviewer','Fixer','Gatekeeper','Observer','Retired helper'][n],station:([1,2,3,4,5,6,7,'archive'] as const)[n],state,contextPercent:n===6?null:12+n*11,latestLog:n===0?'Demo fixture: sorting synthetic intake crates.':null})),
 issues: ['','agent:queued','agent:working','agent:under-review','agent:reworking','agent:ready-for-human','agent:needs-human'].map((label,n)=>({id:`demo-crate-${n+1}`,number:101+n,title:['Welcome packet','Radar calibration','Workshop roof','Tower optics','Road repairs','Storefront signage','Bridge inspection'][n],labels:label?[label]:[],authorizedPendingClaim:false,mergedAt:null,previewReadyAt:null,closedAt:null}))
};
export function offlineDemo(): Snapshot { return {...demo,status:{online:false,stale:true,source:'demo'}}; }
