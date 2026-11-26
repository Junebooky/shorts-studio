import {test} from 'node:test';import assert from 'node:assert/strict';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {VoicePanel} from '../src/editor/VoicePanel';import {TimingPanel} from '../src/editor/TimingPanel';import {Waveform} from '../src/editor/Waveform';import {alignTranscript} from '../src/core/timing';import {demo} from '../src/core/project';
const onSeek=()=>{};
test('voice panel renders safe pre-connection state and keeps real approval separate',()=>{
 const html=renderToStaticMarkup(createElement(VoicePanel,{project:demo,busy:false,dirty:false,onRun:()=>{},onResult:async()=>{}}));
 assert.match(html,/로컬 설정 확인 중/);assert.match(html,/원본 음성 없음/);assert.match(html,/disabled[^>]*>AI 음성 생성 \+ 타이밍/);
});
test('timeline displays real evidence, low confidence and missing word limitation',()=>{
 const input={script:'오늘 시작',audio:'workspace/mock/voice.wav',durationMs:2000,source:'whisper' as const,segments:[{text:'오늘 시작',startMs:100,endMs:1500,words:[{text:'오늘',startMs:100,endMs:500,confidence:.3},{text:'시작',startMs:700,endMs:1500}]}]};
 const html=renderToStaticMarkup(createElement(TimingPanel,{analysis:alignTranscript(input).analysis,onSeek}));
 assert.match(html,/Whisper 음성 인식/);assert.match(html,/검수 필요/);assert.match(html,/낮은 인식 신뢰도/);assert.match(html,/0\.10초/);
 const srt=renderToStaticMarkup(createElement(TimingPanel,{analysis:alignTranscript({...input,source:'srt',segments:[{text:'오늘 시작',startMs:100,endMs:1500}]}).analysis,onSeek}));assert.match(srt,/어절 타이밍은 추정하지 않습니다/);
});
test('waveform has no fake peaks before decoding',()=>{const html=renderToStaticMarkup(createElement(Waveform,{audio:null,durationMs:2000,onSeek}));assert.match(html,/음성을 추가하면 실제 파형이 표시됩니다/);assert.doesNotMatch(html,/<svg/);});
