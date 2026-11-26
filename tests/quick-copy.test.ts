import {test} from 'node:test';import assert from 'node:assert/strict';
import {quickStageLabels,quickStatusLabel,quickStartHint} from '../src/copy/quick-create';
const ready={disabled:false,configured:true,available:true,subject:true,voice:true,consent:true,configError:false};
test('quick creation labels cover every stage and do not imply final approval',()=>{
 assert.deepEqual(Object.keys(quickStageLabels).sort(),['done','render','script','storyboard','verify','voice']);
 assert.match(quickStatusLabel({status:'done',stage:'done'}),/초안/);
 for(const stage of Object.keys(quickStageLabels) as (keyof typeof quickStageLabels)[]){
  assert.doesNotMatch(quickStatusLabel({status:'error',stage}),/준비됐어요|완성/);
 }
 assert.match(quickStatusLabel({status:'running',stage:'done'}),/확인하고/);
});
test('quick creation hints follow the real disabled conditions',()=>{
 assert.equal(quickStartHint(ready),'');
 assert.match(quickStartHint({...ready,disabled:true}),/진행 중/);
 assert.match(quickStartHint({...ready,configured:false}),/확인하고/);
 assert.match(quickStartHint({...ready,configured:false,configError:true}),/확인하지 못했어요/);
 assert.match(quickStartHint({...ready,available:false}),/연결 설정/);
 assert.match(quickStartHint({...ready,subject:false}),/주제/);
 assert.match(quickStartHint({...ready,voice:false}),/목소리/);
 assert.match(quickStartHint({...ready,consent:false}),/비용/);
});
