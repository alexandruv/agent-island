import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindViewControl} from '../src/view-control';
test('startup fallback and renderer loss cannot expose an empty island',()=>{
 const classes=new Set<string>();let click:()=>void=()=>{};
 const root={classList:{add:(s:string)=>classes.add(s),remove:(s:string)=>classes.delete(s),contains:(s:string)=>classes.has(s),toggle:(s:string)=>classes.has(s)?classes.delete(s):classes.add(s)}};
 const button={disabled:false,textContent:'',addEventListener:(_type:string,handler:()=>void)=>{click=handler;}};
 const view=bindViewControl(root as unknown as HTMLElement,button as unknown as HTMLButtonElement);
 for(let n=0;n<2;n++){click();assert.ok(classes.has('lane-only'));assert.equal(button.disabled,true);assert.equal(button.textContent,'Lane view only');}
 view.setAvailable(true);assert.equal(button.disabled,false);assert.equal(button.textContent,'Lane view');
 click();assert.ok(classes.has('details-open'));assert.equal(classes.has('lane-only'),false);assert.equal(button.textContent,'Close lane view');
 click();assert.equal(classes.has('details-open'),false);
 view.setAvailable(false);click();assert.ok(classes.has('lane-only'));assert.equal(button.disabled,true);assert.equal(button.textContent,'Lane view only');
});
