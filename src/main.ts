import { connectFeed, selectedDetails } from './live-feed';
import { bindViewControl } from './view-control';
import { demo, offlineDemo } from './fixture';
import { stations, agentDetails, issueDetails, issueStation, issueState, contextText, symbols, statusText, actualPreviewUrl, type Snapshot } from './contract';
import './style.css';
let snapshot: Snapshot = demo;
const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`<header><div><span class="eyebrow">READ-ONLY · DEMO · SYNTHETIC FIXTURES</span><h1>◈ Agent Island</h1></div><div class="controls"><label>Mode <select id="fixture"><option value="feed">Server feed</option><option value="online">Online demo</option><option value="offline">Mac offline demo</option></select></label><button id="view" aria-expanded="false">Lane view</button></div></header><p id="status" role="status"></p><main><section class="world" aria-label="Isometric island"><div id="scene"></div></section><aside class="lane-panel" aria-label="Lane details"><section class="lanes" aria-label="Station lanes"></section></aside></main><footer>↺ Rework: Review → Build <span>┄ Changes: Preview → Intake</span><p>No production controls. No actions. Demo data only.</p></footer><dialog aria-labelledby="detail-title"><button id="close">Close details</button><h2 id="detail-title"></h2><div id="detail-body"></div></dialog>`;
const dialog=root.querySelector('dialog')!;
let selectedId:string|null=null;
let feedSnapshot:Snapshot=demo;
let mode='feed';
document.addEventListener('keydown', e => { if(e.key === 'Escape' && dialog.open) dialog.close(); });
function paragraph(text:string){const p=document.createElement('p');p.textContent=text;return p;}
function details(title:string, lines:string[], button:HTMLElement){selectedId=button.id;view.openDetails();root.querySelector('#detail-title')!.textContent=title;root.querySelector('#detail-body')!.replaceChildren(...lines.map(paragraph));dialog.showModal();}
root.querySelector('#close')!.addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{(selectedId?document.getElementById(selectedId):null)?.focus();if(!selectedId || !document.getElementById(selectedId))root.querySelector<HTMLButtonElement>('#view')!.focus();selectedId=null;});
function render(){
 root.querySelector('.eyebrow')!.textContent=snapshot.status.source==='demo'?'READ-ONLY · DEMO · SYNTHETIC FIXTURES':'READ-ONLY · SERVER FEED';
 root.querySelector('footer p')!.textContent='No production controls. No actions. Production locked.';
 const focusedId=(document.activeElement as HTMLElement)?.id;
 root.querySelector('#status')!.textContent=statusText(snapshot);
 root.classList.toggle('offline',!snapshot.status.online);
 const lanes=root.querySelector('.lanes')!;lanes.replaceChildren();
 for(const [number,title,subtitle] of [...stations,['archive','Archive rock','Closed agents'] as const]){
 const section=document.createElement('section');section.className='station';
 const heading=document.createElement('h2');heading.textContent=`${number==='archive'?'◇':number} ${title}`;section.append(heading,paragraph(subtitle));
 for(const a of snapshot.agents.filter(a=>a.station===number)){
 const b=document.createElement('button');b.id=a.id;b.className=`entity robot ${a.state}`;b.setAttribute('aria-label',`${a.name}, ${a.state}, ${contextText(a.contextPercent)}`);
 const face=document.createElement('span');face.className='robot-face';face.textContent='▣';
 b.append(face,paragraph(`${symbols[a.state]} ${a.name} · ${a.state==='needs-human'?'Needs you':a.state}`),paragraph(contextText(a.contextPercent)));
 if(a.state==='working' && a.latestLog !== null) { const bubble=paragraph(a.latestLog); bubble.className='log-bubble'; b.append(bubble); }
 if(contextText(a.contextPercent)!=='Context unknown'){const meter=document.createElement('meter');meter.min=0;meter.max=100;meter.value=a.contextPercent!;meter.setAttribute('aria-label',`${a.name} context usage`);b.append(meter);}
 b.onclick=()=>details(a.name,agentDetails(a),b);section.append(b);
 }
 for(const i of snapshot.issues.filter(i=>issueStation(i,actualPreviewUrl(snapshot))===number)){
 const b=document.createElement('button');b.id=i.id;b.className=`entity crate ${i.labels.includes('agent:needs-human')?'needs-human':''}`;
 b.textContent=`▣ #${i.number} ${i.title} · ${issueState(i,actualPreviewUrl(snapshot))}`;
 b.onclick=()=>details(`#${i.number} ${i.title}`,issueDetails(i,actualPreviewUrl(snapshot)),b);section.append(b);
 }
 if(number===7){const url=actualPreviewUrl(snapshot);if(url && snapshot.issues.some(i=>issueStation(i,url)===7)){const link=document.createElement('a');link.href=url;link.textContent='Open actual preview';link.rel='noopener noreferrer';section.append(link);}else section.append(paragraph('Preview link not supplied · readiness unconfirmed'));}
 lanes.append(section);
 }
 const extra=document.createElement('section');extra.className='station support';extra.append(paragraph('▤ Setup & admin shed · Operator clipboard'),paragraph(`◉ Watchers lighthouse · ${!snapshot.status.online?'offline · cached data stale':snapshot.status.stale?'stale feed':snapshot.status.source==='demo'?'demo heartbeat · synthetic':'fresh source heartbeat'}`),paragraph('🔒 Production city · permanently locked bridge'));const sources=(snapshot as Snapshot & {sources?:Record<string,string>}).sources;if(sources && snapshot.status.source!=='demo')extra.append(paragraph(Object.entries(sources).map(([k,v])=>`${k}: ${v}`).join(' · ')));lanes.append(extra);
 if(focusedId && !dialog.open)document.getElementById(focusedId)?.focus();
 if(selectedId && dialog.open){const current=selectedDetails(snapshot,selectedId);root.querySelector('#detail-title')!.textContent=current?.title??'Object no longer supplied';root.querySelector('#detail-body')!.replaceChildren(...(current?.agent?agentDetails(current.agent):current?.issue?issueDetails(current.issue,actualPreviewUrl(snapshot)):[`Stable ID: ${selectedId}`,'Removed from the latest snapshot; current state unknown.']).map(paragraph));}
 document.dispatchEvent(new Event('island-snapshot'));

}
render();
root.querySelector('#fixture')!.addEventListener('change',e=>{mode=(e.target as HTMLSelectElement).value;snapshot=mode==='feed'?feedSnapshot:mode==='offline'?offlineDemo():demo;render();});
connectFeed(s=>{feedSnapshot=s;if(mode==='feed'){snapshot=s;render();}});
const view=bindViewControl(root,root.querySelector<HTMLButtonElement>('#view')!);
 import('./scene').then(({drawIsland})=>{drawIsland(root.querySelector('#scene')!,()=>snapshot,fallback);view.setAvailable(true);}).catch(()=>fallback());

function fallback(){view.setAvailable(false);root.querySelector('#scene')!.textContent='Island rendering unavailable. All stations and details are available in the lanes.';}
