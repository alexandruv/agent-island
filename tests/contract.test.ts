import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demo,offlineDemo} from '../src/fixture';
import {issueStation,issueState,contextText,statusText,safePreviewUrl} from '../src/contract';
const base=demo.issues[0];
test('conflicting labels keep placement, state and details consistent',async()=>{
 const {issueDetails}=await import('../src/contract');
 for(const labels of [['agent:reworking','agent:ready-for-human'],['agent:ready-for-human','agent:reworking']]) {
  const issue={...base,labels};
  assert.equal(issueStation(issue,null),5);
  assert.equal(issueState(issue,null),'↺ Reworking');
  assert.ok(issueDetails(issue,null).includes('↺ Reworking'));
  assert.doesNotMatch(issueDetails(issue,null).join('\n'),/Ready for human/);
 }
 assert.equal(issueState({...base,labels:['agent:needs-human','agent:reworking','agent:ready-for-human']},null),'☁ Needs you');
});
test('label mapping and authorized pending claim',()=>{
 for(const [label,station] of [['agent:queued',2],['agent:working',3],['agent:under-review',4],['agent:reworking',5],['agent:ready-for-human',6],['agent:needs-human',5]] as const)assert.equal(issueStation({...base,labels:[label]},null),station);
 assert.equal(issueStation({...base,authorizedPendingClaim:true},null),2);
 assert.equal(issueStation({...base,labels:['unrecognized']},null),1);
});
test('merge and preview require actual metadata',()=>{
 const ready={...base,labels:['agent:ready-for-human'],previewReadyAt:'2026-01-01'};
 assert.equal(issueStation(ready,'https://example.test'),6);assert.match(issueState(ready,null),/merge unconfirmed/);
 const merged={...base,mergedAt:'2026-01-01'};
 assert.equal(issueStation(merged,'https://example.test'),6);
 assert.equal(issueStation({...merged,previewReadyAt:'2026-01-02'},null),6);
 assert.equal(issueStation({...merged,previewReadyAt:'2026-01-02'},'https://example.test'),7);
 assert.equal(issueStation({...base,closedAt:'2026-01-01'},null),'archive');
 assert.equal(safePreviewUrl('javascript:alert(1)'),null);
});
test('unknown context and offline status are explicit',()=>{
 for(const value of [null,NaN,-1,101])assert.equal(contextText(value),'Context unknown');
 assert.equal(contextText(42),'Context 42%');assert.match(statusText(offlineDemo()),/Mac offline · cached data stale/);
 assert.match(statusText({...demo,status:{...demo.status,stale:true}}),/Stale snapshot/);
 assert.equal(demo.previewUrl,null);assert.equal(demo.status.source,'demo');
 const ids=[...demo.agents,...demo.issues].map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
});

test('preview trust excludes demo, offline, stale, unsafe URLs and missing metadata',async()=>{
 const {actualPreviewUrl}=await import('../src/contract');
 const live={...demo,status:{online:true,stale:false,source:'live' as const},previewUrl:'https://preview.example.test/',issues:[{...base,mergedAt:'2026-10-13T12:00:00Z',previewReadyAt:'2026-10-13T12:01:00Z'}]};
 assert.equal(actualPreviewUrl(live),live.previewUrl);
 for(const source of ['demo','cache'] as const)assert.equal(actualPreviewUrl({...live,status:{...live.status,source}}),null);
 assert.equal(actualPreviewUrl({...live,status:{...live.status,online:false}}),null);
 assert.equal(actualPreviewUrl({...live,status:{...live.status,stale:true}}),null);
 assert.equal(actualPreviewUrl({...live,issues:[base]}),null);
 for(const url of ['javascript:alert(1)','http://example.test','https://user:password@example.test','not a URL'])assert.equal(safePreviewUrl(url),null);
});

test('fixture has every robot state without invented pipeline success',()=>{
 assert.deepEqual(new Set(demo.agents.map(a=>a.state)),new Set(['working','idle','waiting-permit','failed','stuck','needs-human','closed','unknown']));
 assert.ok(demo.issues.every(i=>i.mergedAt===null && i.previewReadyAt===null));
 assert.ok(demo.agents.every(a=>a.latestLog===null || a.latestLog.startsWith('Demo fixture:')));
});

test('details preserve stable IDs, unknowns and only supplied sanitized log',async()=>{
 const {agentDetails,issueDetails}=await import('../src/contract');
 const unknown=agentDetails(demo.agents[6]);
 assert.ok(unknown.includes('Stable ID: demo-robot-7'));
 assert.ok(unknown.includes('Context unknown'));
 assert.ok(unknown.includes('Latest log: not supplied'));
 assert.ok(agentDetails(demo.agents[0]).some(line=>line==='Latest sanitized log: '+demo.agents[0].latestLog));
 const ready=issueDetails(demo.issues[5],null).join('\n');
 assert.match(ready,/Stable ID: demo-crate-6/);assert.match(ready,/merge unconfirmed/);
 assert.match(ready,/Merged: not confirmed/);assert.match(ready,/Preview ready: not confirmed/);
});
