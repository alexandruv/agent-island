import * as T from 'three';
import { stations, symbols, contextText, type Snapshot } from './contract';
import { createBackdrop, createIssueCrates, stationPoints } from './scene-layout';
export function islandCamera(){
 const camera=new T.OrthographicCamera(-12,12,12,-12,.1,100);camera.position.set(16,19,24);camera.lookAt(0,0,0);camera.updateMatrixWorld();return camera;
}
// Textures use a fixed font; camera fitting scales sprites to CSS pixels, never shrinks text.
export const labelFontPixels=16;
export function fitIslandCamera(camera:T.OrthographicCamera,scene:T.Scene,width:number,height:number){
 scene.updateMatrixWorld(true);camera.updateMatrixWorld();
 const bounds=new T.Box3();let horizontalPadding=16;
 scene.traverse(object=>{
  if(object.userData.background)return;
  if(object instanceof T.Sprite){
   bounds.expandByPoint(object.getWorldPosition(new T.Vector3()).applyMatrix4(camera.matrixWorldInverse));
   horizontalPadding=Math.max(horizontalPadding,(object.userData.labelWidth??0)/2+16);
  }else if(object instanceof T.Mesh){
   const box=new T.Box3().setFromObject(object);
   for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])bounds.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  }
 });
 const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
 const unitsPerPixel=Math.max(size.x/Math.max(1,width-2*horizontalPadding),size.y/Math.max(1,height-96));
 camera.left=center.x-width*unitsPerPixel/2;camera.right=center.x+width*unitsPerPixel/2;
 camera.bottom=center.y-height*unitsPerPixel/2;camera.top=center.y+height*unitsPerPixel/2;camera.updateProjectionMatrix();
 scene.traverse(object=>{if(object instanceof T.Sprite)object.scale.set((object.userData.labelWidth??170)*unitsPerPixel,28*unitsPerPixel,1);});
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
 function sign(text:string,x:number,y:number,z:number){const sprite=new T.Sprite(labelMaterial(text));sprite.name=text;sprite.userData.labelWidth=sprite.material.map?.image?.width ? sprite.material.map.image.width/2 : text.length*9+24;sprite.position.set(x,y,z);sprite.scale.set(3.4,.65,1);scene.add(sprite);}
 const robots:T.Group[]=[];
 stations.forEach(([n,title],i)=>{const p=points[i];mesh(new T.BoxGeometry(1.5,1.3,1.3),i===6?0x88715a:0x657083,p.x,.8,p.z-.8);const roof=mesh(new T.ConeGeometry(1.2,.8,4),0x24394c,p.x,1.85,p.z-.8);roof.rotation.y=Math.PI/4;
 if(i===3)mesh(new T.BoxGeometry(.8,1.7,.8),0x617891,p.x,2,p.z-.8);
 mesh(new T.BoxGeometry(.5,.5,.04),0xffce78,p.x,1,p.z-.13);sign(`${n} ${title}`,p.x,i===4?4.8:3.3,p.z);
 const robot=new T.Group();robot.position.set(p.x+.8,.6,p.z+.5);scene.add(robot);robots.push(robot);
 const part=(g:T.BufferGeometry,c:number,x:number,y:number,z:number)=>{const m=new T.Mesh(g,material(c));m.position.set(x,y,z);robot.add(m);};
 part(new T.BoxGeometry(.45,.6,.35),0xa7c4d3,0,.1,0);part(new T.SphereGeometry(.37,8,6),0xb2ccda,0,.7,0);part(new T.BoxGeometry(.42,.18,.1),0x12253a,0,.72,.3);for(const x of [-.13,.13])part(new T.SphereGeometry(.045,6,4),0x79eaff,x,.72,.36);
 part(new T.BoxGeometry(.18,.3,.24),0x4e6276,-.18,-.3,0);part(new T.BoxGeometry(.18,.3,.24),0x4e6276,.18,-.3,0);
 const a=snapshot().agents.find(a=>a.station===n)!;robot.userData.entityId=a.id;
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
 for(const crate of createIssueCrates(snapshot()))scene.add(crate);
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
 const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);if(width>0&&height>0)fitIslandCamera(camera,scene,width,height);};new ResizeObserver(resize).observe(host);resize();
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);onUnavailable();});
 renderer.setAnimationLoop(time=>{const feed=snapshot().status; (beacon.material as T.MeshStandardMaterial).color.setHex(!feed.online?0x34435d:feed.stale?0xc18e45:0xffd784);beacon.scale.setScalar(feed.online&&!feed.stale?1+Math.sin(time/700)*.12:1);robots.forEach((r,i)=>{const a=snapshot().agents.find(a=>a.station===i+1);r.position.y=.6+(a?.state==='working'&&snapshot().status.online?Math.sin(time/240)*.08:0);});renderer.render(scene,camera);});
}
