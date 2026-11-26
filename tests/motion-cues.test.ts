import {test} from 'node:test';import assert from 'node:assert/strict';
import {resolveCues,cueFrame,assertResolvedCues,CUE_DEFAULT_FPS} from '../src/core/motion-cues';import {alignTranscript} from '../src/core/timing';
const a=alignTranscript({script:'작은 선택',audio:'workspace/x/a.wav',durationMs:2500,source:'elevenlabs-tts',segments:[{text:'작은 선택',startMs:200,endMs:1300,words:[{text:'작은',startMs:200,endMs:600},{text:'선택',startMs:710,endMs:1300}]}]}).analysis;
const v={type:'focus' as const,word:'선택'};
test('motion start from recorded word, exact composition frame',()=>{const c=resolveCues([{slot:0,wordIndex:1,expectedWord:'선택'}],v,a,0,2000)[0];assert.equal(c.startMs,710);assert.equal(cueFrame(c,0,30),22);assert.equal(cueFrame(c,201,30),15);});
test('reject guessed word, wrong scene and invalid slot',()=>{assert.throws(()=>resolveCues([{slot:0,wordIndex:1,expectedWord:'다름'}],v,a,0,2000));assert.throws(()=>resolveCues([{slot:0,wordIndex:1,expectedWord:'선택'}],v,a,800,2000));assert.throws(()=>resolveCues([{slot:1,wordIndex:1,expectedWord:'선택'}],v,a,0,2000));});

import {demo,FPS,type Project} from '../src/core/project';
import {compileStoryboard} from '../src/core/storyboard';
const input={slot:0,wordIndex:1,expectedWord:'선택'};
test('composition default FPS stays consistent and a real stored cue reconstructs exactly',()=>{
 assert.equal(CUE_DEFAULT_FPS,FPS);const cues=resolveCues([input],v,a,0,2000);
 assert.doesNotThrow(()=>assertResolvedCues(cues,v,a,0,2000));
 assert.throws(()=>assertResolvedCues([{...cues[0],startMs:709}],v,a,0,2000),/저장된 모션/);
});
test('reject forged flattened evidence and contradictory segment words',()=>{
 const forged={...a,words:a.words.map((w,i)=>i===1?{...w,startMs:700}:w)};
 assert.throws(()=>resolveCues([input],v,forged,0,2000),/전체 어절/);
 const contradictory={...a,segments:a.segments.map(s=>({...s,text:'다른 대본'}))};
 assert.throws(()=>resolveCues([input],v,contradictory,0,2000),/텍스트 근거/);
 const overlap={...a,segments:a.segments.map(s=>({...s,words:s.words.map((w,i)=>i===1?{...w,startMs:500}:w)})),words:a.words.map((w,i)=>i===1?{...w,startMs:500}:w)};
 assert.throws(()=>resolveCues([input],v,overlap,0,2000),/어절 타이밍/);
 assert.throws(()=>resolveCues([input],v,{...a,sourceAudio:null},0,2000),/원본 음성/);
});
test('reject punctuation-only, low-confidence and frame-invisible word anchors',()=>{
 const punctuation=alignTranscript({script:'!',audio:'workspace/x/a.wav',durationMs:2000,source:'whisper',segments:[{text:'!',startMs:100,endMs:500,words:[{text:'!',startMs:100,endMs:500}]}]}).analysis;
 assert.throws(()=>resolveCues([{slot:0,wordIndex:0,expectedWord:'!'}],v,punctuation,0,2000),/어절 타이밍/);
 const low=alignTranscript({script:'선택',audio:'workspace/x/a.wav',durationMs:2000,source:'whisper',segments:[{text:'선택',startMs:100,endMs:500,words:[{text:'선택',startMs:100,endMs:500,confidence:.4}]}]}).analysis;
 assert.throws(()=>resolveCues([{...input,wordIndex:0}],v,low,0,2000),/신뢰도/);
 const short=alignTranscript({script:'선택',audio:'workspace/x/a.wav',durationMs:2000,source:'whisper',segments:[{text:'선택',startMs:1990,endMs:2000,words:[{text:'선택',startMs:1990,endMs:2000}]}]}).analysis;
 assert.throws(()=>resolveCues([{...input,wordIndex:0}],v,short,0,2000),/표시 가능한 프레임/);
 assert.doesNotThrow(()=>resolveCues([{...input,wordIndex:0}],v,short,0,2000,120));
});
test('storyboard compilation resolves actual word cue and keeps original narration, captions and fixed style',()=>{
 const p:Project={...demo,id:'cue-test',script:a.sourceScript,audio:a.sourceAudio,durationMs:a.durationMs,analysis:a,timingSource:'elevenlabs-tts',styleId:'kinetic',scenes:[],captions:[{id:'cap-0',text:'작은 선택',startMs:200,endMs:1300}]};
 const board={version:1,projectId:p.id,baseRevision:p.revision,styleId:'kinetic',theme:demo.theme,direction:{concept:'선택',audience:'일반',style:'키네틱 타이포',author:'agent'},beats:[{captionIds:['cap-0'],purpose:'강조',metaphor:'선택',headline:'선택',kicker:'01',detail:'작은 선택',visual:v,cues:[input]}]};
 const q=compileStoryboard(p,board);
 assert.equal(q.audio,p.audio);assert.deepEqual(q.captions,p.captions);assert.equal(q.styleId,'kinetic');assert.equal(cueFrame(q.scenes[0].cues![0],0,FPS),22);
 assert.throws(()=>compileStoryboard({...p,analysis:{...a,words:a.words.map((w,i)=>i===1?{...w,startMs:700}:w)}},board),/전체 어절/);
});
