import {test,expect} from '@playwright/test';
import * as T from 'three';
import {createIssueCrates} from '../../src/scene-layout';
import {demo} from '../../src/fixture';
import {createIslandScene,islandCamera,fitIslandCamera} from '../../src/scene';
test('360px lanes, keyboard details, offline and unknown',async({page})=>{
 await page.setViewportSize({width:360,height:800});await page.goto('/');
 await expect(page.locator('canvas')).toHaveCount(0);
 await expect(page.locator('.station')).toHaveCount(9);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
 await page.locator('#demo-robot-7').focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('dialog')).toContainText('Context unknown');await expect(page.getByRole('dialog')).toContainText('Latest log: not supplied');
 await page.keyboard.press('Escape');await expect(page.locator('#demo-robot-7')).toBeFocused();
 await page.locator('#demo-crate-6').click();await expect(page.getByRole('dialog')).toContainText('merge unconfirmed');await page.keyboard.press('Escape');
 await page.selectOption('#fixture','offline');await expect(page.getByRole('status')).toContainText('cached data stale');
 await expect(page.getByRole('link')).toHaveCount(0);
 await page.screenshot({path:'docs/validation/phone-360.png',fullPage:true});
});
test('desktop and unavailable WebGL fallback',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
 const canvas=page.locator('canvas');const rect=(await canvas.boundingBox())!;
 const camera=islandCamera();const {scene}=createIslandScene(()=>demo,()=>new T.SpriteMaterial());fitIslandCamera(camera,scene,rect.width,rect.height);
 const targets=[{id:'demo-robot-3',position:new T.Vector3(-1.2,1.3,-2.5)},{id:'demo-robot-4',position:new T.Vector3(2.8,1.3,-2.5)},
  ...createIssueCrates(demo).filter(c=>['demo-crate-5','demo-crate-7'].includes(c.userData.entityId)).map(c=>({id:c.userData.entityId,position:c.position}))];
 for(const target of targets){
  const p=target.position.clone().project(camera);
  await canvas.click({position:{x:(p.x+1)*rect.width/2,y:(1-p.y)*rect.height/2}});
  await expect(page.getByRole('dialog')).toContainText(`Stable ID: ${target.id}`);
  await page.keyboard.press('Escape');
 }
 await page.screenshot({path:'docs/validation/desktop.png',fullPage:true});
 await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});await page.reload();await expect(page.locator('#app')).toHaveClass(/lane-only/);await expect(page.locator('#demo-robot-1')).toBeVisible();
 await expect(page.locator('#view')).toBeDisabled();await expect(page.locator('#view')).toHaveText('Lane view only');
 await page.locator('#view').evaluate((button:HTMLButtonElement)=>button.click());await expect(page.locator('#app')).toHaveClass(/lane-only/);
});
test('reduced motion uses useful lanes',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect(page.locator('canvas')).toHaveCount(0);await expect(page.locator('#view')).toBeDisabled();await expect(page.locator('#view')).toHaveText('Lane view only');await page.locator('#view').evaluate((button:HTMLButtonElement)=>button.click());await expect(page.locator('#app')).toHaveClass(/lane-only/);await page.locator('#demo-robot-1').click();await expect(page.getByRole('dialog')).toContainText('Latest sanitized log: Demo fixture');
});

test('intermediate widths expose every station and details in lanes',async({page})=>{
 for(const width of [761,1024,1280]){
  await page.setViewportSize({width,height:900});await page.goto('/');
  await expect(page.locator('canvas')).toHaveCount(0);await expect(page.locator('.station')).toHaveCount(9);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await expect(page.locator('.support')).toContainText('Production city');
  await page.locator('#demo-robot-1').click();await expect(page.getByRole('dialog')).toContainText('Stable ID: demo-robot-1');await page.keyboard.press('Escape');
  await page.locator('#demo-robot-8').click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
 }
});
