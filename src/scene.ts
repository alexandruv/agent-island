import * as T from 'three';
import { stations, symbols, contextText, issueStation, actualPreviewUrl, type Snapshot } from './contract';
export function drawIsland(host: Element, snapshot:()=>Snapshot){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const scene=new T.Scene();const camera=new T.OrthographicCamera(-12,12,12,-12,.1,100);camera.position.set(16,19,24);camera.lookAt(0,0,0);
 scene.add(new T.HemisphereLight(0xb8d6ff,0x233024,2));const sun=new T.DirectionalLight(0xffd7a0,3);sun.position.set(-5,12,8);scene.add(sun);
 const material=(color:number)=>new T.MeshStandardMaterial({color,flatShading:true,roughness:.88});
 function mesh(g:T.BufferGeometry,c:number,x:number,y:number,z:number){const m=new T.Mesh(g,material(c));m.position.set(x,y,z);scene.add(m);return m;}
 const island=mesh(new T.CylinderGeometry(8.5,5.2,3.5,11,1),0x3d5141,0,-2,0);island.rotation.y=.16;
 mesh(new T.IcosahedronGeometry(4,0),0x344341,-1,1,-4).scale.set(1,1.3,.7);
 mesh(new T.CircleGeometry(45,48),0x132d46,0,-5,0).rotation.x=-Math.PI/2;
 for(let n=0;n<20;n++){const a=n*2.4;mesh(new T.IcosahedronGeometry(.8,0),0x38465b,Math.cos(a)*7,-2.5,Math.sin(a)*7);}
 const points=[[-6,3],[-5,-1],[-2,-3],[2,-3],[5,-.5],[4,4],[0,6]].map(([x,z])=>new T.Vector3(x,.05,z));
 const road=new T.CatmullRomCurve3([...points,points[0]],true);mesh(new T.TubeGeometry(road,100,.35,6,true),0x9b8a70,0,0,0);
 for(let n=0;n<65;n++){const p=road.getPoint(n/65);mesh(new T.SphereGeometry(.07,6,4),0xffd990,p.x,p.y+.32,p.z);}
 function sign(text:string,x:number,y:number,z:number){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const c=canvas.getContext('2d')!;c.fillStyle='#101e32';c.fillRect(0,0,512,96);c.strokeStyle='#97b4d3';c.strokeRect(2,2,508,92);c.fillStyle='#f1f5ff';c.font='bold 32px sans-serif';const measured=c.measureText(text).width;if(measured>480)c.font=`bold ${Math.max(14,32*480/measured)}px sans-serif`;c.textAlign='center';c.fillText(text,256,60);const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas)}));sprite.position.set(x,y,z);sprite.scale.set(3.4,.65,1);scene.add(sprite);}
 const robots:T.Group[]=[];const crates: T.Mesh[]=[];
 stations.forEach(([n,title],i)=>{const p=points[i];mesh(new T.BoxGeometry(1.5,1.3,1.3),i===6?0x88715a:0x657083,p.x,.8,p.z-.8);const roof=mesh(new T.ConeGeometry(1.2,.8,4),0x24394c,p.x,1.85,p.z-.8);roof.rotation.y=Math.PI/4;
 if(i===3)mesh(new T.BoxGeometry(.8,1.7,.8),0x617891,p.x,2,p.z-.8);
 mesh(new T.BoxGeometry(.5,.5,.04),0xffce78,p.x,1,p.z-.13);sign(`${n} ${title}`,p.x,3.3,p.z);
 const robot=new T.Group();robot.position.set(p.x+.8,.6,p.z+.5);scene.add(robot);robots.push(robot);
 const part=(g:T.BufferGeometry,c:number,x:number,y:number,z:number)=>{const m=new T.Mesh(g,material(c));m.position.set(x,y,z);robot.add(m);};
 part(new T.BoxGeometry(.45,.6,.35),0xa7c4d3,0,.1,0);part(new T.SphereGeometry(.37,8,6),0xb2ccda,0,.7,0);part(new T.BoxGeometry(.42,.18,.1),0x12253a,0,.72,.3);for(const x of [-.13,.13])part(new T.SphereGeometry(.045,6,4),0x79eaff,x,.72,.36);
 part(new T.BoxGeometry(.18,.3,.24),0x4e6276,-.18,-.3,0);part(new T.BoxGeometry(.18,.3,.24),0x4e6276,.18,-.3,0);
 const crate=mesh(new T.BoxGeometry(.5,.5,.5),0xb78c55,p.x-.8,.4,p.z+.5);crates.push(crate);crate.visible=snapshot().issues.some(issue=>issueStation(issue,actualPreviewUrl(snapshot()))===n);
 const a=snapshot().agents.find(a=>a.station===n)!;
 mesh(new T.BoxGeometry(.9,.07,.08),0x26364e,p.x+.8,1.7,p.z+.5);
 if(contextText(a.contextPercent)!=='Context unknown'){const ratio=a.contextPercent!/100;mesh(new T.BoxGeometry(.9*ratio,.07,.09),0x80cfa6,p.x+.8-.45*(1-ratio),1.7,p.z+.5);}
 sign(`${symbols[a.state]} ${a.name} · ${contextText(a.contextPercent)}`,p.x,2.65,p.z+.6);
 if(a.latestLog)sign(a.latestLog,p.x,4,p.z+.6);
 if(a.state==='waiting-permit')sign('! Permit needed',p.x+.8,1.9,p.z+.5);
 if(a.state==='idle')mesh(new T.BoxGeometry(1,.15,.4),0x8c6c49,p.x+.8,.2,p.z+.5);
 if(['failed','stuck','needs-human'].includes(a.state))robot.traverse(o=>{if(o instanceof T.Mesh)(o.material as T.MeshStandardMaterial).color.setHex(0xc94c61);});
 if(a.state==='needs-human')for(let k=0;k<3;k++)mesh(new T.IcosahedronGeometry(.2+k*.1,0),0xb84b60,p.x+.8,1.8+k*.4,p.z+.5);
 if(i===1){const radar=mesh(new T.ConeGeometry(.6,.2,12),0x76ae8f,p.x+1,1.9,p.z-1);radar.rotation.z=.8;}
 });
 const ray=new T.Raycaster();renderer.domElement.addEventListener('click',e=>{const rect=renderer.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hits=ray.intersectObjects(scene.children,true);if(!hits.length)return;const hit=hits[0].object;if(hit.userData.entityId)document.getElementById(hit.userData.entityId)?.click();const idx=robots.findIndex(r=>r===hit||r.children.includes(hit));if(idx>=0)document.getElementById(snapshot().agents.find(a=>a.station===idx+1)!.id)?.click();const ci=crates.indexOf(hit as T.Mesh);if(ci>=0){const issue=snapshot().issues.find(issue=>issueStation(issue,actualPreviewUrl(snapshot()))===ci+1);if(issue)document.getElementById(issue.id)?.click();}});
 mesh(new T.BoxGeometry(2.8,.18,2),0x846b50,-6,-.05,4);
 for(const x of [-6.9,-5.1])mesh(new T.CylinderGeometry(.12,.12,2,6),0x665240,x,-.8,4.7);
 for(const x of [3.3,4.7])mesh(new T.BoxGeometry(.18,1.6,.25),0xc3b17a,x,.8,4.5);
 mesh(new T.BoxGeometry(.4,.7,.3),0xafc6d2,-4,.7,6);mesh(new T.SphereGeometry(.3,8,6),0xb2ccda,-4,1.3,6);mesh(new T.BoxGeometry(.3,.4,.05),0xe8d1a0,-3.7,.9,6.2);
 const archivedHead=mesh(new T.SphereGeometry(.3,8,6),0x7b8c9e,-9,.4,4);const archivedBody=mesh(new T.BoxGeometry(.4,.5,.3),0x677b8d,-9,-.1,4);archivedHead.userData.entityId=archivedBody.userData.entityId=snapshot().agents.find(a=>a.station==='archive')!.id;
 // Visible route cues are informational; no production action exists.
 const loop=new T.CatmullRomCurve3([points[3],new T.Vector3(0,.4,-.7),points[2]]);mesh(new T.TubeGeometry(loop,20,.055,4),0xe8b65d,0,0,0);sign('↺ Review → Build',0,1,-1);
 const changes=new T.CatmullRomCurve3([points[6],new T.Vector3(-4,.4,6),points[0]]);for(let n=0;n<18;n++){const p=changes.getPoint(n/18);mesh(new T.SphereGeometry(.055,6,4),0xc0d6ec,p.x,p.y,p.z);}sign('Changes → Intake',-4,1.5,5.8);
 mesh(new T.BoxGeometry(4,.15,1),0x6d6962,9,0,-2);mesh(new T.BoxGeometry(.15,1.8,1.5),0xe8ab52,7.5,.8,-2);sign('🔒 Production locked',11,3,-3);mesh(new T.CylinderGeometry(3,2,2,7),0x34435d,13,-1,-4);
 for(let n=0;n<5;n++)mesh(new T.BoxGeometry(.6,1+n*.4,.7),0x4c607b,11+n*.7,1,-4);
 mesh(new T.CylinderGeometry(.4,.65,3,8),0xabbdc5,6,1,6);const beacon=mesh(new T.SphereGeometry(.35,8,6),0xffd784,6,2.8,6);sign('Watchers ◉',6,4,6);
 mesh(new T.BoxGeometry(1,1,1),0x6c746d,-5,.6,6);sign('Setup & admin · ▤ Operator',-5,2.5,7);
 mesh(new T.IcosahedronGeometry(1.5,0),0x566073,-9,-1,4);sign('◇ Archive',-9,1,4);
 const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.left=-12*width/height;camera.right=12*width/height;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(host);resize();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.querySelector('#app')!.classList.add('lane-only');});
 renderer.setAnimationLoop(time=>{const feed=snapshot().status; (beacon.material as T.MeshStandardMaterial).color.setHex(!feed.online?0x34435d:feed.stale?0xc18e45:0xffd784);beacon.scale.setScalar(feed.online&&!feed.stale?1+Math.sin(time/700)*.12:1);robots.forEach((r,i)=>{const a=snapshot().agents.find(a=>a.station===i+1);r.position.y=.6+(a?.state==='working'&&snapshot().status.online?Math.sin(time/240)*.08:0);});renderer.render(scene,camera);});
}
