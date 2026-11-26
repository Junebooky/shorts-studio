import {test} from 'node:test';import assert from 'node:assert/strict';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {VoicePanel} from '../src/editor/VoicePanel';import {TimingPanel} from '../src/editor/TimingPanel';import {Waveform} from '../src/editor/Waveform';import {alignTranscript} from '../src/core/timing';import {demo} from '../src/core/project';
const onSeek=()=>{};
test('voice panel renders safe pre-connection state and keeps real approval separate',()=>{
 const html=renderToStaticMarkup(createElement(VoicePanel,{project:demo,busy:false,dirty:false,onRun:()=>{},onResult:async()=>{}}));
 assert.match(html,/음성 서비스 설정을 확인하고 있어요/);assert.match(html,/아직 추가한 음성이 없어요/);assert.match(html,/disabled[^>]*>AI 음성 만들기/);
});
test('timeline displays real evidence, low confidence and missing word limitation',()=>{
 const input={script:'오늘 시작',audio:'workspace/mock/voice.wav',durationMs:2000,source:'whisper' as const,segments:[{text:'오늘 시작',startMs:100,endMs:1500,words:[{text:'오늘',startMs:100,endMs:500,confidence:.3},{text:'시작',startMs:700,endMs:1500}]}]};
 const html=renderToStaticMarkup(createElement(TimingPanel,{analysis:alignTranscript(input).analysis,onSeek}));
 assert.match(html,/Whisper 음성 인식/);assert.match(html,/확인이 필요해요/);assert.match(html,/음성 인식이 불확실해요/);assert.match(html,/0\.10초/);
 const srt=renderToStaticMarkup(createElement(TimingPanel,{analysis:alignTranscript({...input,source:'srt',segments:[{text:'오늘 시작',startMs:100,endMs:1500}]}).analysis,onSeek}));assert.match(srt,/어절의 시간을 임의로 추정하지 않아요/);
});
test('waveform has no fake peaks before decoding',()=>{const html=renderToStaticMarkup(createElement(Waveform,{audio:null,durationMs:2000,onSeek}));assert.match(html,/음성을 추가하면 실제 파형을 볼 수 있어요/);assert.doesNotMatch(html,/<svg/);});
