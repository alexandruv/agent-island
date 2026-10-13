import * as T from 'three';
import { stations, symbols, contextText, type Snapshot } from './contract';
import { createBackdrop, createIssueCrates, stationPoints } from './scene-layout';
export function islandCamera(){
 const camera=new T.OrthographicCamera(-12,12,12,-12,.1,100);camera.position.set(16,19,24);camera.lookAt(0,0,0);camera.updateMatrixWorld();return camera;
}
// Textures use a fixed font; camera fitting scales sprites to CSS pixels, never shrinks text.
export const labelFontPixels=16;
export function fitIslandCamera(camera:T.OrthographicCamera,scene:T.Scene,width:number,height:number){
 scene.traverse(object=>{if(object.userData.labelAnchor)object.position.copy(object.userData.labelAnchor);});
 scene.updateMatrixWorld(true);camera.updateMatrixWorld();
 const bounds=new T.Box3();const horizontalPadding=12;
 scene.traverse(object=>{
  if(object.userData.background)return;
  if(object instanceof T.Sprite){
   bounds.expandByPoint(object.getWorldPosition(new T.Vector3()).applyMatrix4(camera.matrixWorldInverse));

  }else if(object instanceof T.Mesh){
   const vertices=object.geometry.getAttribute('position');
   for(let i=0;i<vertices.count;i++)bounds.expandByPoint(new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(object.matrixWorld).applyMatrix4(camera.matrixWorldInverse));
  }
 });
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const unitsPerPixel=Math.max(size.x/Math.max(1,width-2*horizontalPadding),size.y/Math.max(1,height-96));
 camera.left=center.x-width*unitsPerPixel/2;camera.right=center.x+width*unitsPerPixel/2;
 camera.bottom=center.y-height*unitsPerPixel/2;camera.top=center.y+height*unitsPerPixel/2;camera.updateProjectionMatrix();
 scene.traverse(object=>{if(object instanceof T.Sprite)object.scale.set((object.userData.labelWidth??170)*unitsPerPixel,28*unitsPerPixel,1);});
 // Keep the world anchors, but clear fixed station signs in CSS pixel space.
 // Recompute from the anchors on every resize so offsets never accumulate.
 const sprites=scene.children.filter((object):object is T.Sprite=>object instanceof T.Sprite);
 const rectangle=(sprite:T.Sprite)=>{
  const p=sprite.position.clone().project(camera);
  return {x:(p.x+1)*width/2,y:(1-p.y)*height/2,halfWidth:sprite.userData.labelWidth/2};
 };
 const occupied:ReturnType<typeof rectangle>[]=[];
 const cameraUp=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,1);
 const cameraRight=new T.Vector3().setFromMatrixColumn(camera.matrixWorld,0);
 // Place every sign and bubble, not only robot labels, with deterministic screen clearance.
 for(const sprite of sprites){sprite.visible=sprite.userData.labelRole==='station';}
 for(const sprite of sprites.filter(s=>s.userData.labelRole==='station')){
  const rect=rectangle(sprite),gap=32;
  const x=Math.max(rect.halfWidth+8,Math.min(width-rect.halfWidth-8,rect.x));
  const candidates=[Math.max(20,Math.min(height-20,rect.y)),...occupied.flatMap(other=>[other.y-gap,other.y+gap])];
  const y=candidates.filter(y=>y>=20&&y<=height-20&&occupied.every(other=>
   Math.abs(x-other.x)>=rect.halfWidth+other.halfWidth+4||Math.abs(y-other.y)>=gap
  )).sort((a,b)=>Math.abs(a-rect.y)-Math.abs(b-rect.y))[0];
  sprite.visible=y!==undefined;
  if(y!==undefined){sprite.position.addScaledVector(cameraUp,(rect.y-y)*unitsPerPixel).addScaledVector(cameraRight,(x-rect.x)*unitsPerPixel);occupied.push({...rect,x,y});}
 }
 scene.updateMatrixWorld(true);
}
export function pickEntity(scene:T.Scene,camera:T.Camera,point:T.Vector2):string|undefined{
 scene.updateMatrixWorld(true);
 const ray=new T.Raycaster();ray.setFromCamera(point,camera);
 for(const hit of ray.intersectObjects(scene.children,true)){
  let object:T.Object3D|null=hit.object;
  while(object){if(object.userData.entityId)return object.userData.entityId;object=object.parent;}
 }
}
export function createIslandScene(snapshot:()=>Snapshot, labelMaterial:(text:string)=>T.SpriteMaterial){
 const scene=new T.Scene();
 scene.add(new T.HemisphereLight(0xb8d6ff,0x233024,2));const sun=new T.DirectionalLight(0xffd7a0,3);sun.position.set(-5,12,8);scene.add(sun);
 const material=(color:number)=>new T.MeshStandardMaterial({color,flatShading:true,roughness:.88});
 function mesh(g:T.BufferGeometry,c:number,x:number,y:number,z:number){const m=new T.Mesh(g,material(c));m.position.set(x,y,z);scene.add(m);return m;}
 const island=mesh(new T.CylinderGeometry(8.5,5.2,3.5,11,1),0x3d5141,0,-2,0);island.rotation.y=.16;
 scene.add(createBackdrop());
 const ocean=mesh(new T.CircleGeometry(45,48),0x132d46,0,-5,0);ocean.rotation.x=-Math.PI/2;ocean.userData.background=true;
 for(let n=0;n<20;n++){const a=n*2.4;mesh(new T.IcosahedronGeometry(.8,0),0x38465b,Math.cos(a)*7,-2.5,Math.sin(a)*7);}
 const points=stationPoints;
 const road=new T.CatmullRomCurve3([...points,points[0]],true);mesh(new T.TubeGeometry(road,100,.35,6,true),0x9b8a70,0,0,0);
 for(let n=0;n<65;n++){const p=road.getPoint(n/65);mesh(new T.SphereGeometry(.07,6,4),0xffd990,p.x,p.y+.32,p.z);}
 function sign(text:string,x:number,y:number,z:number,role?:'station'|'robot'){const sprite=new T.Sprite(labelMaterial(text));sprite.name=text;sprite.userData.labelWidth=sprite.material.map?.image?.width ? sprite.material.map.image.width/2 : text.length*9+24;sprite.position.set(x,y,z);sprite.userData.labelRole=role;sprite.userData.labelAnchor=sprite.position.clone();sprite.scale.set(3.4,.65,1);scene.add(sprite);}
 const robots:T.Group[]=[];
 stations.forEach(([n,title],i)=>{const p=points[i];mesh(new T.BoxGeometry(1.5,1.3,1.3),i===6?0x88715a:0x657083,p.x,.8,p.z-.8);const roof=mesh(new T.ConeGeometry(1.2,.8,4),0x24394c,p.x,1.85,p.z-.8);roof.rotation.y=Math.PI/4;
 if(i===3)mesh(new T.BoxGeometry(.8,1.7,.8),0x617891,p.x,2,p.z-.8);
 mesh(new T.BoxGeometry(.5,.5,.04),0xffce78,p.x,1,p.z-.13);sign(`${n} ${title}`,p.x,i===4?4.8:3.3,p.z,'station');
 const robot=new T.Group();robot.position.set(p.x+.8,.6,p.z+.5);scene.add(robot);robots.push(robot);
 const part=(g:T.BufferGeometry,c:number,x:number,y:number,z:number)=>{const m=new T.Mesh(g,material(c));m.position.set(x,y,z);robot.add(m);};
 part(new T.BoxGeometry(.45,.6,.35),0xa7c4d3,0,.1,0);part(new T.SphereGeometry(.37,8,6),0xb2ccda,0,.7,0);part(new T.BoxGeometry(.42,.18,.1),0x12253a,0,.72,.3);for(const x of [-.13,.13])part(new T.SphereGeometry(.045,6,4),0x79eaff,x,.72,.36);
 part(new T.BoxGeometry(.18,.3,.24),0x4e6276,-.18,-.3,0);part(new T.BoxGeometry(.18,.3,.24),0x4e6276,.18,-.3,0);
 const a=snapshot().agents.find(a=>a.station===n)!;robot.userData.entityId=a.id;
 mesh(new T.BoxGeometry(.9,.07,.08),0x26364e,p.x+.8,1.7,p.z+.5);
 if(contextText(a.contextPercent)!=='Context unknown'){const ratio=a.contextPercent!/100;mesh(new T.BoxGeometry(.9*ratio,.07,.09),0x80cfa6,p.x+.8-.45*(1-ratio),1.7,p.z+.5);}
 sign(`${symbols[a.state]} ${a.name} · ${contextText(a.contextPercent)}`,p.x,2.65,p.z+.6,'robot');
 if(a.latestLog)sign(a.latestLog,p.x,4,p.z+.6,'robot');
 if(a.state==='waiting-permit')sign('! Permit needed',p.x+.8,1.9,p.z+.5,'robot');
 if(a.state==='idle')mesh(new T.BoxGeometry(1,.15,.4),0x8c6c49,p.x+.8,.2,p.z+.5);
 if(['failed','stuck','needs-human'].includes(a.state))robot.traverse(o=>{if(o instanceof T.Mesh)(o.material as T.MeshStandardMaterial).color.setHex(0xc94c61);});
 if(a.state==='needs-human')for(let k=0;k<3;k++)mesh(new T.IcosahedronGeometry(.2+k*.1,0),0xb84b60,p.x+.8,1.8+k*.4,p.z+.5);
 // Distinct silhouettes follow the dock → yard → workshop → tower → shed → gate → shop road.
 if(i===1)for(let k=0;k<3;k++)mesh(new T.BoxGeometry(.6,.5,.6),0x8d704f,p.x-1,.3+k*.5,p.z-1);
 if(i===2){mesh(new T.CylinderGeometry(.16,.22,1.4,6),0x4b5664,p.x-.5,2,p.z-1);mesh(new T.BoxGeometry(1,.4,.8),0x4a3b31,p.x, .3,p.z+.4);}
 if(i===3){mesh(new T.CylinderGeometry(1.1,1.3,.4,6),0x56667a,p.x,.2,p.z);}
 if(i===5){for(const dx of [-.6,.6])mesh(new T.BoxGeometry(.18,1.8,.25),0xb59a63,p.x+dx,.9,p.z+.2);mesh(new T.BoxGeometry(1.4,.18,.25),0xb59a63,p.x,1.8,p.z+.2);}
 if(i===6){mesh(new T.BoxGeometry(1.7,.12,.8),0x7292ab,p.x,1.2,p.z+.1);for(const dx of [-.45,.45])mesh(new T.BoxGeometry(.35,.6,.05),0xffcf78,p.x+dx,.7,p.z-.12);}
 if(i===1){const radar=mesh(new T.ConeGeometry(.6,.2,12),0x76ae8f,p.x+1,1.9,p.z-1);radar.rotation.z=.8;}
 });
 for(const crate of createIssueCrates(snapshot()))scene.add(crate);
 mesh(new T.BoxGeometry(2.8,.18,2),0x846b50,-6,-.05,4);
 for(const x of [-6.9,-5.1])mesh(new T.CylinderGeometry(.12,.12,2,6),0x665240,x,-.8,4.7);
 for(const x of [3.3,4.7])mesh(new T.BoxGeometry(.18,1.6,.25),0xc3b17a,x,.8,4.5);
 mesh(new T.BoxGeometry(.4,.7,.3),0xafc6d2,-4,.7,6);mesh(new T.SphereGeometry(.3,8,6),0xb2ccda,-4,1.3,6);mesh(new T.BoxGeometry(.3,.4,.05),0xe8d1a0,-3.7,.9,6.2);
 const archivedHead=mesh(new T.SphereGeometry(.3,8,6),0x7b8c9e,-9,.4,4);const archivedBody=mesh(new T.BoxGeometry(.4,.5,.3),0x677b8d,-9,-.1,4);archivedHead.userData.entityId=archivedBody.userData.entityId=snapshot().agents.find(a=>a.station==='archive')!.id;
 // Visible route cues are informational; no production action exists.
 const loop=new T.CatmullRomCurve3([points[3],new T.Vector3(0,.4,-.7),points[2]]);mesh(new T.TubeGeometry(loop,20,.055,4),0xe8b65d,0,0,0);sign('↺ Review → Build',0,1,-1);
 const changes=new T.CatmullRomCurve3([points[6],new T.Vector3(-4,.4,6),points[0]]);for(let n=0;n<18;n++){const p=changes.getPoint(n/18);mesh(new T.SphereGeometry(.055,6,4),0xc0d6ec,p.x,p.y,p.z);}sign('Changes → Intake',-4,1.5,5.8);
 mesh(new T.BoxGeometry(4,.15,1),0x6d6962,9,0,-2);mesh(new T.BoxGeometry(.15,1.8,1.5),0xe8ab52,7.5,.8,-2);sign('🔒 Production locked',11,3,-3,'station');mesh(new T.CylinderGeometry(2,1.6,2,7),0x34435d,11,-1,-4);
 for(let n=0;n<5;n++)mesh(new T.BoxGeometry(.6,1+n*.4,.7),0x4c607b,9.5+n*.65,1,-4);
 mesh(new T.CylinderGeometry(.4,.65,3,8),0xabbdc5,6,1,6);for(const y of [.4,1.4])mesh(new T.CylinderGeometry(.52,.56,.4,8),0x9c4d50,6,y,6);mesh(new T.CylinderGeometry(.8,.8,.12,8),0x394b61,6,2.5,6);const beacon=mesh(new T.SphereGeometry(.35,8,6),0xffd784,6,2.8,6);sign('Watchers ◉',6,4,6,'station');
 mesh(new T.BoxGeometry(1,1,1),0x6c746d,-5,.6,6);const operatorRoof=mesh(new T.ConeGeometry(.9,.5,4),0x35455b,-5,1.3,6);operatorRoof.rotation.y=Math.PI/4;sign('Setup & admin · ▤ Operator',-5,2.5,7,'station');
 mesh(new T.IcosahedronGeometry(1.5,0),0x566073,-9,-1,4);sign('◇ Archive',-9,1,4,'station');
 return {scene,robots,beacon};
}
export function drawIsland(host: Element, snapshot:()=>Snapshot,onUnavailable:()=>void){
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);
 const camera=islandCamera();
 const {scene,robots,beacon}=createIslandScene(snapshot,text=>{
  const canvas=document.createElement('canvas');const c=canvas.getContext('2d')!;
  c.font=`bold ${labelFontPixels*2}px sans-serif`;canvas.width=Math.ceil(c.measureText(text).width)+48;canvas.height=56;
  c.fillStyle='#101e32';c.fillRect(0,0,canvas.width,56);c.strokeStyle='#97b4d3';c.strokeRect(1,1,canvas.width-2,54);
  c.fillStyle='#f1f5ff';c.font=`bold ${labelFontPixels*2}px sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,canvas.width/2,28);
  return new T.SpriteMaterial({map:new T.CanvasTexture(canvas),depthTest:false});
 });
 renderer.domElement.addEventListener('click',e=>{const rect=renderer.domElement.getBoundingClientRect();const id=pickEntity(scene,camera,new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1));if(id)document.getElementById(id)?.click();});
 const signs=scene.children.filter((o):o is T.Sprite=>o instanceof T.Sprite&&o.userData.labelRole==='station');
 const labels=signs.map(sign=>{const label=document.createElement('span');label.className='station-label';label.textContent=sign.name;host.append(label);return label;});
 const hint=document.createElement('div');hint.className='entity-hint';document.querySelector('header')!.append(hint);
 renderer.domElement.addEventListener('pointermove',e=>{const rect=renderer.domElement.getBoundingClientRect();const id=pickEntity(scene,camera,new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1));hint.textContent=id?document.getElementById(id)?.textContent??'':'';});
 renderer.domElement.addEventListener('pointerleave',()=>{hint.textContent='';});
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let lost=false;
 const paint=(time=0)=>{const feed=snapshot().status; (beacon.material as T.MeshStandardMaterial).color.setHex(!feed.online?0x34435d:feed.stale?0xc18e45:0xffd784);beacon.scale.setScalar(!motion.matches&&feed.online&&!feed.stale?1+Math.sin(time/700)*.12:1);robots.forEach((r,i)=>{const a=snapshot().agents.find(a=>a.station===i+1);r.position.y=.6+(!motion.matches&&a?.state==='working'&&feed.online?Math.sin(time/240)*.08:0);});renderer.render(scene,camera);};
 const resize=()=>{const {width,height}=host.getBoundingClientRect();if(lost||width<=0||height<=0)return;renderer.setSize(width,height);fitIslandCamera(camera,scene,width,height);
  signs.forEach((sign,i)=>{const p=sign.position.clone().project(camera);labels[i].style.width=`${sign.userData.labelWidth}px`;labels[i].style.left=`${(p.x+1)*width/2-sign.userData.labelWidth/2}px`;labels[i].style.top=`${(1-p.y)*height/2-14}px`;});
  scene.children.forEach(o=>{if(o instanceof T.Sprite)o.visible=false;});paint();
 };new ResizeObserver(resize).observe(host);resize();
 const animate=()=>{if(lost)return;renderer.setAnimationLoop(motion.matches?null:paint);paint();};
 motion.addEventListener('change',animate);
 document.querySelector('#fixture')?.addEventListener('change',()=>paint());
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;renderer.setAnimationLoop(null);onUnavailable();});
 animate();
}
