import {test,expect} from '@playwright/test';
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
 await page.setViewportSize({width:1280,height:900});await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
 await page.screenshot({path:'docs/validation/desktop.png',fullPage:true});
 await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});await page.reload();await expect(page.locator('#app')).toHaveClass(/lane-only/);await expect(page.locator('#demo-robot-1')).toBeVisible();
});
test('reduced motion uses useful lanes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect(page.locator('canvas')).toHaveCount(0);await page.locator('#demo-robot-1').click();await expect(page.getByRole('dialog')).toContainText('Latest sanitized log: Demo fixture');
});
