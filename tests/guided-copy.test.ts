import {test} from 'node:test';import assert from 'node:assert/strict';
import {guidedSteps,guidedHeadings,guidedNext,guidedNextHint,personaPreviewLabel,personaLanguageLabel,voiceIdFormatHint} from '../src/copy/guided-creation';
import {quickStatusLabel,quickStartHint} from '../src/copy/quick-create';
test('guided labels match the actual four steps and three next actions',()=>{
 assert.equal(guidedSteps.length,4);assert.equal(guidedHeadings.length,4);assert.equal(guidedNext.length,3);
 assert.match(guidedNextHint(0,false,false,false),/주제/);
 assert.match(guidedNextHint(2,true,false,false),/목소리를 선택/);
 assert.equal(guidedNextHint(2,true,false,true),voiceIdFormatHint);
 assert.equal(guidedNextHint(2,true,true,true),'');
 assert.equal(guidedNextHint(1,true,false,false),'');
});
test('voice preview and language metadata do not imply selected or verified quality',()=>{
 assert.equal(personaPreviewLabel('테스트 성우',false),'테스트 성우 미리 듣기');
 assert.equal(personaPreviewLabel('테스트 성우',true),'테스트 성우 미리 듣기 멈추기');
 assert.equal(personaLanguageLabel(false),'한국어 지원 확인 전');
 assert.equal(personaLanguageLabel(true),'한국어 정보 있음');
});
test('draft and consent copy retain actual readiness boundaries',()=>{
 assert.match(quickStatusLabel({status:'done',stage:'done'}),/초안/);
 assert.match(quickStartHint({disabled:false,configured:true,available:true,subject:true,voice:true,consent:false,configError:false}),/비용/);
});
