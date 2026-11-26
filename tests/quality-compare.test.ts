import {test} from 'node:test';import assert from 'node:assert/strict';
import {compareQuality,type QualitySnapshot} from '../src/core/quality/compare';
import type {LayoutFinding} from '../src/core/quality/layout';
const f=(frame:number,code:LayoutFinding['code']='unsafe'):LayoutFinding=>({frame,code,roles:['headline']});
const snapshot=(runId:string,findings:LayoutFinding[],sampled=[0,30],missing:number[]=[]):QualitySnapshot=>({version:1,projectId:'demo',revision:1,runId,report:{version:1,mode:'preview',frames:[0,30],checks:[{id:'size',name:'size',status:'pass',detail:'',required:true}],layout:{version:1,sampled,missing,findings}}});
test('only common measured frames support new and no-longer-detected candidates',()=>{
 const a=snapshot('a',[f(0),f(30)]),b=snapshot('b',[f(0,'overlap')],[0],[30]);const r=compareQuality(a,b);
 assert.deepEqual(r.common,[0]);assert.deepEqual(r.unavailable,[30]);assert.deepEqual(r.removed,[f(0)]);assert.deepEqual(r.added,[f(0,'overlap')]);assert.deepEqual(r.beforeOnly,[30]);
});
test('no common evidence is not an improvement',()=>{const a=snapshot('a',[f(0)],[0]),b=snapshot('b',[],[30]);const r=compareQuality(a,b);assert.equal(r.comparable,false);assert.deepEqual(r.removed,[]);assert.deepEqual(r.unavailable,[0,30]);});
test('duplicates remain distinct and unrelated projects or same run rejected',()=>{const a=snapshot('a',[f(0),f(0)]),b=snapshot('b',[f(0)]);const r=compareQuality(a,b);assert.equal(r.removed.length,1);assert.equal(r.remaining.length,1);assert.throws(()=>compareQuality(a,a));assert.throws(()=>compareQuality(a,{...b,projectId:'other'}));});
