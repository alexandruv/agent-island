import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

test('committed acceptance screenshots retain the operator-provided SHA-256 hashes',()=>{
 const hashes={
  '1280':'13e1a96f5fd94f426f8d4b11c6f57627887d3fd6642997808a93426afe98313e',
  '1440':'681f4442e908ea81eb95e9584fbb001c70e0f546ee19fd44ec1d29348716063e',
  '390':'a3b6c2827c05ea7ce2c4d2ca0ee290ba1693bf1e700716da1fff9cda1194ced0',
 };
 for(const [width,hash] of Object.entries(hashes)){
  const path=`docs/acceptance/a14e927/island-${width}.png`;
  assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),hash,path);
 }
});
