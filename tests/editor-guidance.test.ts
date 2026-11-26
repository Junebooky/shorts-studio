import {test} from 'node:test';import assert from 'node:assert/strict';
import {redrawHint,redrawStatusLabel,timingIssueLabel} from '../src/copy/editor-guidance';
const ready={disabled:false,running:false,audio:true,current:true,matched:true,words:true};
test('redraw guidance explains missing evidence without asking to regenerate paid audio',()=>{
 assert.equal(redrawHint(ready),'');
 assert.match(redrawHint({...ready,audio:false}),/음성을 먼저 추가/);
 assert.match(redrawHint({...ready,current:false}),/기존 음성에 자막/);
 assert.match(redrawHint({...ready,words:false}),/단어별 발화 시간/);
 assert.match(redrawHint({...ready,matched:false}),/확인이 필요한 항목/);
 assert.match(redrawHint({...ready,disabled:true}),/저장/);
 assert.equal(redrawHint({...ready,running:true}), '');
});
test('redraw progress never claims a new voice generation or final approval',()=>{
 assert.match(redrawStatusLabel({status:'running',stage:'storyboard',progress:0}),/준비/);
 assert.match(redrawStatusLabel({status:'running',stage:'storyboard',progress:.1}),/장면/);
 assert.match(redrawStatusLabel({status:'done',stage:'done',progress:1}),/초안/);
 assert.doesNotMatch(redrawStatusLabel({status:'error',stage:'done',progress:1}),/준비됐어요/);
});
test('diagnostic display retains evidence and unknown messages verbatim',()=>{
 assert.equal(timingIssueLabel('낮은 어절 인식 신뢰도: 오늘'),'인식이 불확실한 단어: 오늘');
 assert.equal(timingIssueLabel('자막과 어절 근거 불일치: 구간 2'),'자막과 단어별 발화 내용이 달라요: 구간 2');
 assert.equal(timingIssueLabel('원본 대본 누락 가능: 4자 (구간 3)'),'대본의 일부가 빠졌을 수 있어요: 4자 (구간 3)');
 assert.equal(timingIssueLabel('새로운 오류: 123'),'새로운 오류: 123');
});
