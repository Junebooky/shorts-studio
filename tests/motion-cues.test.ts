import {test} from 'node:test';import assert from 'node:assert/strict';
import {resolveCues,cueFrame} from '../src/core/motion-cues';import {alignTranscript} from '../src/core/timing';
const a=alignTranscript({script:'작은 선택',audio:'workspace/x/a.wav',durationMs:2500,source:'elevenlabs-tts',segments:[{text:'작은 선택',startMs:200,endMs:1300,words:[{text:'작은',startMs:200,endMs:600},{text:'선택',startMs:710,endMs:1300}]}]}).analysis;
const v={type:'focus' as const,word:'선택'};
test('motion start from recorded word, exact composition frame',()=>{const c=resolveCues([{slot:0,wordIndex:1,expectedWord:'선택'}],v,a,0,2000)[0];assert.equal(c.startMs,710);assert.equal(cueFrame(c,0,30),22);assert.equal(cueFrame(c,201,30),15);});
test('reject guessed word, wrong scene and invalid slot',()=>{assert.throws(()=>resolveCues([{slot:0,wordIndex:1,expectedWord:'다름'}],v,a,0,2000));assert.throws(()=>resolveCues([{slot:0,wordIndex:1,expectedWord:'선택'}],v,a,800,2000));assert.throws(()=>resolveCues([{slot:1,wordIndex:1,expectedWord:'선택'}],v,a,0,2000));});
