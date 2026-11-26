import {test} from 'node:test';import assert from 'node:assert/strict';
import {productionHints,type GuidanceInput} from '../src/copy/production-hints';
const ready:GuidanceInput={busy:false,dirty:false,rendering:false,current:true,statusError:false,active:false,script:true,voice:true,timing:true,board:true,voiceApproved:true,reviewReady:true,technicalPassed:true,reviewApproved:true,finalReady:true,voiceNotes:true,visualNotes:true,feedback:true};
test('ready actions have no blocking hints',()=>assert.ok(Object.values(productionHints(ready)).every(x=>!x)));
test('unsaved, running and unavailable state override individual guidance',()=>{
 for(const [input,pattern] of [[{dirty:true},/저장/],[{rendering:true},/끝나면/],[{current:false,statusError:true},/확인하지 못했어요/],[{current:false},/확인하고 있어요/]] as const){
  assert.ok(Object.values(productionHints({...ready,...input})).every(x=>pattern.test(x)));
 }
});
test('missing input, approval, storyboard and review are distinct',()=>{
 assert.match(productionHints({...ready,script:false,voice:false,voiceApproved:false}).voice,/대본/);
 assert.match(productionHints({...ready,voice:false}).request,/음성 파일/);
 assert.match(productionHints({...ready,voiceApproved:false}).request,/확인 내용을 저장/);
 assert.match(productionHints({...ready,timing:false}).request,/발화 시간/);
 assert.match(productionHints({...ready,board:false}).review,/스토리보드/);
 assert.match(productionHints({...ready,reviewReady:false}).approve,/검수용 영상/);
 assert.match(productionHints({...ready,technicalPassed:false}).approve,/필수 기술 검사/);
 assert.match(productionHints({...ready,finalReady:false,reviewApproved:false}).final,/영상 검수 확인/);
 assert.match(productionHints({...ready,active:true}).final,/완료하거나 취소/);
 assert.match(productionHints({...ready,feedback:false}).feedback,/수정할 부분/);
});
