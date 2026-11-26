import {test} from 'node:test';
import assert from 'node:assert/strict';
import {agentStageLabels,captionTimeLabels,colorLabels,renderStatusLabel,sceneLabels,timingSourceLabels} from '../src/copy/labels';

test('render status never implies final approval and unknown values stay unverified',()=>{
  assert.equal(renderStatusLabel('running'),'영상을 만들고 있어요');
  assert.equal(renderStatusLabel('done'),'영상 파일이 준비됐어요');
  assert.equal(renderStatusLabel('error'),'영상을 만들지 못했어요');
  assert.equal(renderStatusLabel('cancelled'),'영상 만들기를 취소했어요');
  assert.equal(renderStatusLabel('future'),'작업 상태 확인 필요');
});
test('all stored enum values have distinct Korean display labels',()=>{
  assert.deepEqual(Object.keys(timingSourceLabels).sort(),['demo','elevenlabs-align','elevenlabs-tts','manual','srt','unverified','whisper']);
  assert.deepEqual(Object.keys(agentStageLabels).sort(),['blocked','cancelled','completed','queued','review-ready','storyboard-ready','working']);
  assert.deepEqual(Object.keys(sceneLabels).sort(),['closing','compare','hook','orbit','steps']);
  assert.deepEqual(Object.keys(colorLabels).sort(),['accent','background','foreground']);
  assert.deepEqual(Object.keys(captionTimeLabels).sort(),['endMs','startMs']);
  for(const labels of [timingSourceLabels,agentStageLabels,sceneLabels,colorLabels,captionTimeLabels]){
    const values=Object.values(labels);assert.equal(new Set(values).size,values.length);
    for(const value of values)assert.match(value,/[가-힣]/);
  }
  assert.equal(timingSourceLabels.unverified,'발화 시간 확인 전');
  assert.equal(agentStageLabels.working,'작업 기록 중');
});
