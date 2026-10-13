import {test,expect,type Page} from '@playwright/test';
import * as T from 'three';
import {createIssueCrates} from '../../src/scene-layout';
import {demo} from '../../src/fixture';
import {createIslandScene,islandCamera,fitIslandCamera} from '../../src/scene';
async function expectSignRectangles(page:Page,width:number,height:number){
 await expect(page.locator('.station-label')).toHaveCount(11);
 await expect.poll(async()=>page.locator('.station-label').evaluateAll(nodes=>nodes.every(n=>!!(n as HTMLElement).style.left))).toBe(true);
 const signs=await page.locator('.station-label').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
  for(const [i,a] of signs.entries()){
   expect(a.left).toBeGreaterThanOrEqual(0);expect(a.right).toBeLessThanOrEqual(width);expect(a.top).toBeGreaterThanOrEqual(72);expect(a.bottom).toBeLessThanOrEqual(height);
   for(const b of signs.slice(i+1))expect(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top).toBe(true);
  }
}
// Only for the documented managed macOS bootstrap denial; ordinary runs execute all assertions.
test.beforeEach(async({page})=>{
 await page.route('**/api/snapshot',route=>route.fulfill({json:demo}));
 await page.routeWebSocket('**/api/feed',ws=>ws.send(JSON.stringify({type:'snapshot',snapshot:demo})));
});
test.skip(process.env.ISLAND_BROWSER_HOST_BLOCKED==='1','Managed host denies Chromium bootstrap; operator validation required');
for(const [width,height] of [[1280,800],[1440,900],[360,800],[390,844]]){
 test(`full viewport island ${width}`,async({page},testInfo)=>{
  await page.setViewportSize({width,height});await page.goto('/');
  const canvas=page.locator('#scene canvas');await expect(canvas).toBeVisible();
  await expect(page.locator('#app')).not.toHaveClass(/lane-only/);
  const box=(await canvas.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(width*.9);expect(box.height).toBeGreaterThanOrEqual(height*.7);
  await expect(page.getByText('Island rendering unavailable',{exact:false})).toHaveCount(0);
  await expect(page.locator('.lanes')).not.toBeVisible();
  await expect(page.locator('.station-label')).toHaveCount(11);
  await expectSignRectangles(page,width,height);
  const path=`test-results/island-${width}.png`;await page.screenshot({path});await testInfo.attach(`island-${width}`,{path,contentType:'image/png'});
  await page.getByRole('button',{name:'Lane view',exact:true}).click();await expect(page.locator('.lanes')).toBeVisible();await expect(canvas).toBeVisible();
  await page.locator('#demo-robot-7').focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog')).toContainText('Context unknown');await page.keyboard.press('Escape');await expect(page.locator('#demo-robot-7')).toBeFocused();
  await page.getByRole('button',{name:'Close lane view',exact:true}).click();await expect(page.locator('.lanes')).not.toBeVisible();
 });
}
test('scene selection opens details for Builder, Reviewer and both Rework issues',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');
 const canvas=page.locator('#scene canvas');await expect(canvas).toBeVisible();const rect=(await canvas.boundingBox())!;
 const camera=islandCamera();const {scene}=createIslandScene(()=>demo,()=>new T.SpriteMaterial());fitIslandCamera(camera,scene,rect.width,rect.height);
 const targets=[{id:'demo-robot-3',position:new T.Vector3(-1.2,1.3,-2.5)},{id:'demo-robot-4',position:new T.Vector3(2.8,1.3,-2.5)},...createIssueCrates(demo).filter(c=>['demo-crate-5','demo-crate-7'].includes(c.userData.entityId)).map(c=>({id:c.userData.entityId,position:c.position}))];
 for(const target of targets){const p=target.position.clone().project(camera);await canvas.click({position:{x:(p.x+1)*rect.width/2,y:(1-p.y)*rect.height/2}});await expect(page.getByRole('dialog')).toContainText(`Stable ID: ${target.id}`);await expect(page.locator('.lanes')).toBeVisible();await page.keyboard.press('Escape');await page.locator('#view').click();}
});
test('WebGL failure and context loss expose usable fallback lanes',async({page})=>{
 await page.goto('/');await expect(page.locator('#scene canvas')).toBeVisible();
 await page.locator('#scene canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
 await expect(page.locator('.lanes')).toBeVisible();await expect(page.locator('#view')).toBeDisabled();
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args);} as typeof original;});
 await page.reload();await expect(page.locator('#app')).toHaveClass(/lane-only/);await expect(page.locator('#demo-robot-1')).toBeVisible();await expect(page.locator('#scene')).toContainText('Island rendering unavailable');
});
test('reduced motion retains a static island and offline details',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect(page.locator('#scene canvas')).toBeVisible();await expect(page.locator('.lanes')).not.toBeVisible();
 const first=await page.locator('#scene canvas').screenshot();await page.waitForTimeout(150);expect(await page.locator('#scene canvas').screenshot()).toEqual(first);
 await page.selectOption('#fixture','offline');await expect(page.locator('#status')).toContainText('cached data stale');await page.locator('#view').click();await page.locator('#demo-robot-1').click();await expect(page.getByRole('dialog')).toContainText('Latest sanitized log: Demo fixture');await expect(page.getByRole('link')).toHaveCount(0);
});

test('station HTML rectangles remain clear through constrained-height resizes',async({page})=>{
 await page.goto('/');await expect(page.locator('#scene canvas')).toBeVisible();
 for(const [width,height] of [[1280,300],[390,360],[600,320],[1440,260],[390,844],[1280,800],[1280,300]]){
  await page.setViewportSize({width,height});
  await expect.poll(async()=> (await page.locator('#scene canvas').boundingBox())?.width).toBe(width);
  // ResizeObserver commits positions asynchronously; check rendered rectangles after layout.
  await expect(async()=>{await expectSignRectangles(page,width,height);}).toPass();
  await expect(page.locator('.lanes')).not.toBeVisible();
 }
});

test('height-only viewport growth and shrinkage refit canvas and signs',async({page})=>{
 await page.setViewportSize({width:1280,height:300});await page.goto('/');
 const canvas=page.locator('#scene canvas');await expect(canvas).toBeVisible();
 for(const height of [300,800,300,900,260,800]){
  await page.setViewportSize({width:1280,height});
  await expect.poll(async()=>{
   const box=await canvas.boundingBox();
   return box?{width:box.width,height:box.height}:null;
  }).toEqual({width:1280,height:height-72});
  await expect(async()=>{await expectSignRectangles(page,1280,height);}).toPass();
  await expect(page.locator('.lanes')).not.toBeVisible();
 }
});
