import {test} from 'node:test';import assert from 'node:assert/strict';
import {styleCopy} from '../src/copy/styles';
test('all six preset IDs have unique, compact Korean display copy',()=>{
 assert.deepEqual(Object.keys(styleCopy).sort(),['cinematic','data','editorial','illustrated','kinetic','minimal']);
 const summaries=Object.values(styleCopy).map(x=>x.summary);assert.equal(new Set(summaries).size,6);
 for(const {summary,detail} of Object.values(styleCopy)){assert.match(summary,/[가-힣]/);assert.ok(summary.length<=32);assert.ok(detail.length<=130);}
});
test('display guidance retains numeric and reference boundaries',()=>{
 assert.match(styleCopy.data.detail,/실제 수치가 있을 때만/);assert.match(styleCopy.data.detail,/수치가 없으면/);
 assert.match(styleCopy.illustrated.detail,/참고용 파일은 영상에 직접 넣지 않아요/);
 assert.match(styleCopy.minimal.detail,/한 장면에 한 가지/);
});
