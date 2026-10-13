import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
test('built root entry and every emitted static import resolve locally',()=>{
 const root=resolve('dist');
 const entry=readFileSync(resolve(root,'index.html'),'utf8');
 const refs=[...entry.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(refs.some(r=>r.endsWith('.js')));
 assert.ok(refs.some(r=>r.endsWith('.css')));
 for(const ref of refs){assert.ok(ref.startsWith('/assets/'));assert.ok(statSync(resolve(root,'.'+ref)).size>0);}
 for(const file of readdirSync(resolve(root,'assets')).filter(f=>f.endsWith('.js'))){
 const code=readFileSync(resolve(root,'assets',file),'utf8');
 for(const match of code.matchAll(/(?:from\s*|import\s*\()\s*["'](\.\/?[^"']+)["']/g))assert.ok(statSync(resolve(root,'assets',match[1])).size>0);
 }
 assert.ok(!readdirSync(root).includes('_worker.js'));
});
