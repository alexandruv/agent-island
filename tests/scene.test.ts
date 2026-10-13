import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createBackdrop,createIssueCrates,stationPoints} from '../src/scene-layout';
import {demo} from '../src/fixture';

const camera=new T.OrthographicCamera(-12,12,12,-12,.1,100);
camera.position.set(16,19,24);camera.lookAt(0,0,0);camera.updateMatrixWorld();
function pick(target: T.Vector3, objects: T.Object3D[]) {
 objects.forEach(o=>o.updateMatrixWorld(true));
 const projected=target.clone().project(camera);
 const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(projected.x,projected.y),camera);
 return ray.intersectObjects(objects,true)[0]?.object;
}
test('rear backdrop leaves Build workshop, Builder and sign unobstructed',()=>{
 const peak=createBackdrop();peak.updateMatrixWorld();
 const bounds=new T.Box3().setFromObject(peak);
 const p=stationPoints[2];
 for(const [size,position] of [
  [new T.Vector3(1.5,1.3,1.3),new T.Vector3(p.x,.8,p.z-.8)],
  [new T.Vector3(.75,1.3,.75),new T.Vector3(p.x+.8,.9,p.z+.5)],
  [new T.Vector3(3.4,.65,.01),new T.Vector3(p.x,3.3,p.z)],
 ] as const) {
  const target=new T.Mesh(new T.BoxGeometry(size.x,size.y,size.z));target.position.copy(position);
  target.updateMatrixWorld();
  assert.equal(bounds.intersectsBox(new T.Box3().setFromObject(target)),false);
  assert.equal(pick(position,[peak,target]),target);
 }
});
test('each issue has its own named crate and stable-ID picking, including both Rework issues',()=>{
 const crates=createIssueCrates(demo);
 assert.equal(crates.length,demo.issues.length);
 assert.deepEqual(crates.map(c=>c.userData.entityId),demo.issues.map(i=>i.id));
 assert.equal(new Set(crates.map(c=>c.position.toArray().join(','))).size,crates.length);
 for(const number of [105,107]) {
  const issue=demo.issues.find(i=>i.number===number)!;
  const crate=crates.find(c=>c.userData.entityId===issue.id)!;
  assert.ok(crate.name.includes(`#${number}`));
  assert.equal(pick(crate.position,[createBackdrop(),...crates])?.userData.entityId,issue.id);
 }
 const archived=createIssueCrates({...demo,issues:[{...demo.issues[0],closedAt:'2026-10-13'}]});
 assert.equal(archived[0].userData.entityId,demo.issues[0].id);
 assert.equal(archived[0].position.x,-9.8);
});

test('complete scene signs cannot consume Reviewer, Builder or Rework crate selection',async()=>{
 const {createIslandScene,islandCamera,pickEntity}=await import('../src/scene');
 const {scene}=createIslandScene(()=>demo,()=>new T.SpriteMaterial());
 const camera=islandCamera();
 const reviewer=scene.children.find(o=>o.userData.entityId==='demo-robot-4')!;
 const head=reviewer.children[1];
 scene.updateMatrixWorld(true);
 const position=head.getWorldPosition(new T.Vector3());
 const sign=scene.children.find(o=>o.name==='5 Rework shed')!;
 const ray=new T.Raycaster();const projected=position.clone().project(camera);
 ray.setFromCamera(new T.Vector2(projected.x,projected.y),camera);
 assert.equal(ray.intersectObject(sign).length,0,'Rework sign is clear of Reviewer head');
 const targets=[{id:'demo-robot-4',position},{id:'demo-robot-3',position:new T.Vector3(-1.2,1.3,-2.5)},
 ...createIssueCrates(demo).filter(c=>['demo-crate-5','demo-crate-7'].includes(c.userData.entityId)).map(c=>({id:c.userData.entityId,position:c.position}))];
 for(const target of targets){const p=target.position.clone().project(camera);assert.equal(pickEntity(scene,camera,new T.Vector2(p.x,p.y)),target.id);}
 // Deliberately put another decorative label directly in front of the head.
 const overlay=new T.Sprite(new T.SpriteMaterial());overlay.position.copy(position).add(camera.position.clone().normalize().multiplyScalar(2));overlay.scale.set(3,3,1);scene.add(overlay);
 scene.updateMatrixWorld(true);
 assert.equal(ray.intersectObjects(scene.children,true)[0].object,overlay);
 assert.equal(pickEntity(scene,camera,new T.Vector2(projected.x,projected.y)),'demo-robot-4');
});

 test('camera contains all content and keeps signs at 16 CSS pixels across desktop widths',async()=>{
 const {createIslandScene,islandCamera,fitIslandCamera,labelFontPixels}=await import('../src/scene');
 const {scene}=createIslandScene(()=>demo,()=>new T.SpriteMaterial());
 for(const width of [1024,900,608]){
  const height=700,camera=islandCamera();fitIslandCamera(camera,scene,width,height);scene.updateMatrixWorld(true);
  scene.traverse(object=>{
   if(object.userData.background)return;
   if(object instanceof T.Sprite){
    if(!object.visible)return;
    const p=object.position.clone().project(camera);
    const halfWidth=object.scale.x/(camera.right-camera.left),halfHeight=object.scale.y/(camera.top-camera.bottom);
    assert.ok(Math.abs(p.x)+halfWidth<=1.00001,`${width}: ${object.name} horizontal bounds`);
    assert.ok(Math.abs(p.y)+halfHeight<=1.00001,`${width}: ${object.name} vertical bounds`);
    const renderedHeight=object.scale.y/(camera.top-camera.bottom)*height;
    assert.ok(Math.abs(renderedHeight*32/56-labelFontPixels)<.00001,`${object.name} font must not shrink`);
    assert.equal(labelFontPixels,16);
   }else if(object instanceof T.Mesh){
    const vertices=object.geometry.getAttribute('position');
    for(let i=0;i<vertices.count;i++){
     const p=new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(object.matrixWorld).project(camera);assert.ok(Math.abs(p.x)<=1.00001&&Math.abs(p.y)<=1.00001,`${width}: geometry cropped`);
    }
   }
  });
 }
});


test('all station signs stay visible and mutually clear at phone and desktop widths',async()=>{
 const {createIslandScene,islandCamera,fitIslandCamera}=await import('../src/scene');
 const {stations}=await import('../src/contract');
 const {scene}=createIslandScene(()=>demo,()=>new T.SpriteMaterial());
 const sprites=scene.children.filter((object):object is T.Sprite=>object instanceof T.Sprite);
 const stationNames=new Set([...stations.map(([number,title])=>`${number} ${title}`),'◇ Archive','🔒 Production locked','Watchers ◉','Setup & admin · ▤ Operator']);
 const signs=sprites.filter(sprite=>stationNames.has(sprite.name));
 const labels=sprites.filter(sprite=>demo.agents.some(agent=>sprite.name.includes(agent.name)||sprite.name===agent.latestLog)||sprite.name==='! Permit needed');
 assert.equal(signs.length,11);
 assert.equal(labels.length,9);
 // Sweep the supported scene range, then repeat the acceptance widths to check resize stability.
 for(const width of [...Array.from({length:1051},(_,index)=>390+index),1280,1440,390]){
  const height=width<=600?772:728,camera=islandCamera();fitIslandCamera(camera,scene,width,height);
  assert.ok(signs.every(sign=>sign.visible));assert.ok(labels.every(label=>!label.visible));
  function rectangle(sprite:T.Sprite){
   const center=sprite.getWorldPosition(new T.Vector3()).project(camera);
   const halfWidth=sprite.scale.x/(camera.right-camera.left)*width/2;
   const halfHeight=sprite.scale.y/(camera.top-camera.bottom)*height/2;
   const x=(center.x+1)*width/2,y=(1-center.y)*height/2;
   return {left:x-halfWidth,right:x+halfWidth,top:y-halfHeight,bottom:y+halfHeight};
  }
  for(const [index,sign] of signs.entries())for(const label of signs.slice(index+1)){
   const a=rectangle(sign),b=rectangle(label);
   const clearance=Math.max(b.left-a.right,a.left-b.right,b.top-a.bottom,a.top-b.bottom);
   assert.ok(clearance>=2,`${width}px: ${sign.name} overlaps or lacks clearance from ${label.name} (${clearance.toFixed(2)}px)`);
  }
 }
});


test('main island fills at least sixty percent of canvas width with support landmarks fitted',async()=>{
 const {createIslandScene,islandCamera,fitIslandCamera}=await import('../src/scene');
 for(const [width,height] of [[1280,728],[1440,828],[390,772]]){
  const {scene}=createIslandScene(()=>demo,()=>new T.SpriteMaterial()),camera=islandCamera();fitIslandCamera(camera,scene,width,height);
  const island=scene.children.find(o=>o instanceof T.Mesh&&o.geometry instanceof T.CylinderGeometry)!;
  assert.ok(island instanceof T.Mesh);
  const vertices=island.geometry.getAttribute('position'),xs:number[]=[];
  for(let i=0;i<vertices.count;i++)xs.push(new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(island.matrixWorld).project(camera).x);
  assert.ok((Math.max(...xs)-Math.min(...xs))/2>=.6,`${width}: island too small`);
 }
});

test('constrained-height packing places every sign and resets anchors on resize',async()=>{
 const {createIslandScene,islandCamera,fitIslandCamera}=await import('../src/scene');
 const {scene}=createIslandScene(()=>demo,()=>new T.SpriteMaterial()),camera=islandCamera();
 const signs=scene.children.filter((o):o is T.Sprite=>o instanceof T.Sprite&&o.userData.labelRole==='station');
 for(const [width,requestedHeight] of [[1280,228],[390,288],[600,248],[1440,188],[390,40],[390,772],[1280,728],[1280,228]]){
  const height=fitIslandCamera(camera,scene,width,requestedHeight);
  const rectangles=signs.map(sign=>{
   assert.ok(sign.visible,sign.name);
   const p=sign.position.clone().project(camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2;
   const halfWidth=sign.userData.labelWidth/2;
   return {left:x-halfWidth,right:x+halfWidth,top:y-14,bottom:y+14};
  });
  for(const [i,a] of rectangles.entries()){
   assert.ok(a.left>=-1e-8&&a.right<=width+1e-8&&a.top>=-1e-8&&a.bottom<=height+1e-8,`${width}x${height}: bounds`);
   for(const b of rectangles.slice(i+1))assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,`${width}x${height}: overlap`);
  }
 }
});
