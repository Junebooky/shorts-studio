import {test} from 'node:test';import assert from 'node:assert/strict';import {alignTranscript,parseWhisperJSON,isCurrent} from '../src/core/timing';
const base={script:'작은 선택, 큰 변화. 오늘 시작합니다.',audio:'workspace/test/voice.wav',durationMs:5000,source:'srt' as const,segments:[{text:'작은선택 큰 변화',startMs:300,endMs:2000},{text:'오늘 시작합니다',startMs:2600,endMs:4500}]};
test('restore original punctuation without changing observed boundaries',()=>{const x=alignTranscript(base);assert.equal(x.analysis.status,'matched');assert.equal(x.analysis.coverage,1);assert.equal(x.captions[0].text,'작은 선택, 큰 변화.');assert.equal(x.captions[1].startMs,2600);assert.deepEqual(x.analysis.pauses,[{startMs:0,endMs:300},{startMs:2000,endMs:2600},{startMs:4500,endMs:5000}]);assert.ok(isCurrent(x.analysis,base));assert.ok(!isCurrent(x.analysis,{...base,script:'수정'}));});
test('mismatches remain visible, no timing is fabricated',()=>{const x=alignTranscript({...base,segments:[{...base.segments[0],text:'완전히 다름'},base.segments[1]]});assert.equal(x.analysis.status,'review');assert.equal(x.captions[0].text,'완전히 다름');assert.equal(x.captions[0].startMs,300);assert.ok(x.analysis.coverage<1);});
test('reject overlapping and out of bounds evidence',()=>{assert.throws(()=>alignTranscript({...base,segments:[base.segments[0],{...base.segments[1],startMs:1900}]}));assert.throws(()=>alignTranscript({...base,segments:[{...base.segments[0],endMs:5001}]}));});
test('Whisper preserves actual word times and confidence',()=>{const segments=parseWhisperJSON({segments:[{text:' 오늘 시작합니다.',start:.5,end:2,words:[{word:' 오늘',start:.5,end:1,probability:.9},{word:' 시작합니다.',start:1.2,end:2,probability:.95}]}]});const x=alignTranscript({...base,script:'오늘 시작합니다.',source:'whisper',segments});assert.equal(x.analysis.words[1].startMs,1200);assert.equal(x.analysis.words[0].confidence,.9);assert.equal(x.analysis.status,'matched');});
test('ambiguous skipped match stays flagged',()=>{const x=alignTranscript({...base,script:'앞부분. 반복 반복',segments:[{text:'반복',startMs:100,endMs:1000}]});assert.equal(x.analysis.status,'review');assert.equal(x.analysis.coverage,0);});

import {parseMotionCraftWords} from '../src/core/timing';
import {frameAt,frames,demo} from '../src/core/project';
test('MotionCraft adapter uses measured word boundaries',()=>{const out=parseMotionCraftWords({mode:'word',words:[{w:'오늘',start:.4,end:.8,p:.9},{w:'시작합니다.',start:.9,end:1.8,p:.8},{w:'다시',start:2.3,end:2.9,p:.9}]});assert.equal(out.length,2);assert.equal(out[0].startMs,400);assert.equal(out[0].endMs,1800);assert.equal(out[1].startMs,2300);assert.equal(out[0].words?.[1].confidence,.8);});
test('MotionCraft adapter rejects overlapping timestamps',()=>assert.throws(()=>parseMotionCraftWords({mode:'word',words:[{w:'오늘',start:.4,end:1.1,p:.9},{w:'다시',start:.9,end:1.8,p:.8}]})));
test('frame boundary covers fractional final frame',()=>{assert.equal(frameAt(1001),31);assert.equal(frames({...demo,durationMs:1001}),31);});

test('low confidence exact match is not automatically accepted',()=>{const segments=parseWhisperJSON({segments:[{text:'오늘 시작합니다.',start:.5,end:2,words:[{word:'오늘',start:.5,end:1,probability:.3},{word:'시작합니다.',start:1.2,end:2,probability:.9}]}]});const x=alignTranscript({...base,script:'오늘 시작합니다.',source:'whisper',segments});assert.equal(x.analysis.coverage,1);assert.equal(x.analysis.status,'review');});

test('matching caption with inconsistent word anchors requires review',()=>{
 const x=alignTranscript({...base,script:'오늘 시작',source:'whisper',segments:[{text:'오늘 시작',startMs:100,endMs:1000,words:[{text:'다른 말',startMs:100,endMs:1000}]}]});
 assert.equal(x.analysis.coverage,1);assert.equal(x.analysis.status,'review');assert.ok(x.analysis.issues.some(i=>i.includes('어절 근거 불일치')));
});
test('ElevenLabs evidence without word anchors requires review',()=>{
 const x=alignTranscript({...base,source:'elevenlabs-tts'});assert.equal(x.analysis.status,'review');
 assert.equal(alignTranscript(base).analysis.status,'matched');
});

import {waveformPeaks} from '../src/core/timing';
test('waveform covers the tail and every channel without missing transients',()=>{
 assert.deepEqual(waveformPeaks([Float32Array.from([0,0,0,0,.5]),Float32Array.from([0,.75,0,0,0])],2),[.75,.5]);
 assert.deepEqual(waveformPeaks([Float32Array.from([0,-1])],180),[0,1]);
 assert.deepEqual(waveformPeaks([],180),[]);
 assert.throws(()=>waveformPeaks([new Float32Array(2),new Float32Array(3)]));
});
