import { bindViewControl } from './view-control';
import { demo, offlineDemo } from './fixture';
import { stations, agentDetails, issueDetails, issueStation, issueState, contextText, symbols, statusText, actualPreviewUrl, type Snapshot } from './contract';
import './style.css';
let snapshot: Snapshot = demo;
const root=document.querySelector<HTMLDivElement>('#app')!;
root.innerHTML=`<header><div><span class="eyebrow">READ-ONLY · DEMO · SYNTHETIC FIXTURES</span><h1>◈ Agent Island</h1><p>A little island. A clear view of the work.</p></div><div class="controls"><label>Fixture <select id="fixture"><option value="online">Online demo</option><option value="offline">Mac offline demo</option></select></label><button id="view">Use lane view</button></div></header><p id="status" role="status"></p><main><section class="world" aria-label="Isometric island"><div id="scene"></div><div class="world-caption">SEVEN STATIONS · ONE READ-ONLY ROAD</div><div class="bridge">🔒 Production city · bridge permanently locked</div></section><section class="lanes" aria-label="Station lanes"></section></main><footer>↺ Rework: Review → Build <span>┄ Changes: Preview → Intake</span><p>No production controls. No actions. Demo data only.</p></footer><dialog aria-labelledby="detail-title"><button id="close">Close details</button><h2 id="detail-title"></h2><div id="detail-body"></div></dialog>`;
const dialog=root.querySelector('dialog')!;
let opener: HTMLElement | null=null;
document.addEventListener('keydown', e => { if(e.key === 'Escape' && dialog.open) dialog.close(); });
function paragraph(text:string){const p=document.createElement('p');p.textContent=text;return p;}
function details(title:string, lines:string[], button:HTMLElement){opener=button;root.querySelector('#detail-title')!.textContent=title;root.querySelector('#detail-body')!.replaceChildren(...lines.map(paragraph));dialog.showModal();}
root.querySelector('#close')!.addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>opener?.focus());
function render(){
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
 if(a.latestLog !== null) { const bubble=paragraph(a.latestLog); bubble.className='log-bubble'; b.append(bubble); }
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
 const extra=document.createElement('section');extra.className='station support';extra.append(paragraph('▤ Setup & admin shed · Operator clipboard'),paragraph(`◉ Watchers lighthouse · ${!snapshot.status.online?'offline · cached data stale':snapshot.status.stale?'stale feed':'fresh demo heartbeat'}`),paragraph('🔒 Production city · permanently locked bridge'));lanes.append(extra);
}
render();
root.querySelector('#fixture')!.addEventListener('change',e=>{snapshot=(e.target as HTMLSelectElement).value==='offline'?offlineDemo():demo;render();});
const view=bindViewControl(root,root.querySelector<HTMLButtonElement>('#view')!);
if(matchMedia('(min-width: 1301px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches){
 import('./scene').then(({drawIsland})=>{view.setAvailable(true);drawIsland(root.querySelector('#scene')!,()=>snapshot,fallback);}).catch(()=>fallback());
}else fallback();
function fallback(){view.setAvailable(false);root.querySelector('#scene')!.textContent='Island rendering unavailable. All stations and details are available in the lanes.';}
