import {test} from 'node:test';import assert from 'node:assert/strict';
import {styleCopy,paletteHelp} from '../src/copy/styles';
test('all six palette IDs have unique compact Korean color copy',()=>{
 assert.deepEqual(Object.keys(styleCopy).sort(),['cinematic','data','editorial','illustrated','kinetic','minimal']);
 const summaries=Object.values(styleCopy).map(x=>x.summary);assert.equal(new Set(summaries).size,6);
 for(const {summary,detail} of Object.values(styleCopy)){assert.match(summary,/색/);assert.ok(summary.length<=32);assert.ok(detail.length<=130);assert.match(detail,/배경/);assert.match(detail,/글자/);assert.match(detail,/포인트/);}
});
test('palette descriptions do not promise fixed motion or scene layout',()=>{
 assert.match(paletteHelp,/장면 구성과 움직임은 대사에 맞춰 별도로/);
 for(const {summary,detail} of Object.values(styleCopy))assert.doesNotMatch(summary+detail,/프레임|레이아웃|차트|아이콘|확대|정렬|애니메이션/);
});
