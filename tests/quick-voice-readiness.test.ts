import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {demo,validate,type Project} from '../src/core/project';
import {emptyBrief,briefCurrent} from '../src/core/creative-brief';
import {draftStoryboard,compileStoryboard,type Storyboard} from '../src/core/storyboard';
import {assertRequestInputs} from '../src/core/task-inputs';
import {PRESETS} from '../src/core/styles';
import {normalizeSpeech} from '../src/core/timing';
import {generateNarration,alignNarration} from '../server/elevenlabs';
import {save,load,root} from '../server/storage';

// Representative length for a topic-to-video draft. All provider responses are synthetic.
const script='우리는 새로운 습관을 만들 때 큰 계획부터 세우곤 합니다. 하지만 시작하기 어려운 계획은 쉽게 미루게 됩니다. 오늘 할 수 있는 작은 행동 하나를 정해 보세요. 책 한 쪽을 읽거나 잠깐 산책하는 것처럼요. 행동을 시작하면 다음 선택도 조금 더 쉬워집니다. 완벽하게 해내는 것보다 다시 시작할 수 있는 환경이 중요합니다. 오늘의 작은 행동이 내일의 방향을 만들어 갑니다.';
const brief={...emptyBrief,purpose:'작은 습관의 시작',audience:'처음 시작하는 사람',takeaway:'오늘 한 가지 행동'};
const durationMs=45000;
const pcm=Buffer.alloc(durationMs*24*2);
for(let i=0;i<pcm.length/2;i++)pcm.writeInt16LE(Math.round(1600*Math.sin(2*Math.PI*440*i/24000)),i*2);
const config={apiKey:'fixture-only'};
const json=(value:unknown)=>new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}});
function originalAlignment(){
 const chars=Array.from(script),stride=Math.floor(44000/chars.length);
 return {characters:chars,character_start_times_seconds:chars.map((_,i)=>i*stride/1000),character_end_times_seconds:chars.map((_,i)=>(i+1)*stride/1000)};
}
function forcedAlignment(){
 const words=script.split(/\s+/),stride=Math.floor(44000/words.length);
 return {words:words.map((text,i)=>({text,start:i*stride/1000,end:(i+1)*stride/1000-.05})),loss:.1};
}
async function initial(id:string){
 return save({...demo,id,revision:0,script,title:'주제로 영상 만들기 테스트',audio:null,captions:[],scenes:[],timingSource:'unverified',styleId:'kinetic',theme:PRESETS.kinetic.theme,creativeBrief:brief});
}
async function clean(id:string){
 await rm(path.join(root,'workspace','projects',id),{recursive:true,force:true});
 await rm(path.join(root,'public','workspace',id),{recursive:true,force:true});
}
function assertStoryboardReady(p:Project){
 const draft=draftStoryboard(p);
 assert.equal(draft.styleId,'kinetic');assert.deepEqual(draft.creativeBrief,brief);assert.ok(draft.wordEvidence.length>20);
 assert.equal(normalizeSpeech(p.captions.map(c=>c.text).join('')),normalizeSpeech(script));
 assert.ok(p.captions.every(c=>c.endMs<=p.durationMs&&c.endMs>c.startMs));
 // Representative mock director response, no extra timestamps or manually edited captions.
 const board:Storyboard={version:1,projectId:p.id,baseRevision:p.revision,styleId:'kinetic',theme:demo.theme,
 direction:{author:'agent',concept:'작은 습관',audience:'일반',style:'임의 제안',plan:{message:'오늘 한 가지',narrative:'시작과 반복',visualApproach:'핵심 메시지 강조',constraints:'원본 유지',referenceDecisions:[]}},
 beats:p.captions.map((c,i)=>({captionIds:[c.id],purpose:'행동 설명',metaphor:'핵심 단어',headline:'작은 행동',kicker:String(i+1),detail:'오늘 시작',visual:{type:'focus',word:'시작'}}))};
 const q=compileStoryboard(p,board);
 assertRequestInputs(p,q);assert.ok(briefCurrent(q));assert.deepEqual(validate(q).errors,[]);
 assert.deepEqual(q.theme,PRESETS.kinetic.theme);
 assert.equal(q.scenes[0].startMs,0);assert.equal(q.scenes.at(-1)?.endMs,durationMs);
 return q;
}
test('quick voice contract: 45s Korean script, one paid TTS call, source bytes and timeline ready for storyboard',async()=>{
 const id='quick-voice-'+randomUUID();
 try{
  const p=await initial(id);let calls=0;
  const request:typeof fetch=async(url,init)=>{calls++;assert.match(String(url),/\/with-timestamps\?output_format=pcm_24000$/);assert.equal(JSON.parse(String(init?.body)).text,script);assert.equal(new Headers(init?.headers).get('xi-api-key'),config.apiKey);return json({audio_base64:pcm.toString('base64'),alignment:originalAlignment()});};
  const {project:q,needsAlignment}=await generateNarration(id,{voiceId:'fixture',revision:p.revision},config,request);
  assert.equal(calls,1);assert.equal(needsAlignment,false);assert.equal(q.durationMs,durationMs);assert.equal(q.analysis?.status,'matched');assert.equal(q.analysis?.coverage,1);
  assert.deepEqual((await readFile(path.join(root,'public',q.audio!))).subarray(44),pcm);
  const persisted=await load(id);const board=assertStoryboardReady(persisted);
  assert.equal(board.audio,persisted.audio);assert.equal(board.script,script);assert.equal(calls,1);
 }finally{await clean(id);}
});
test('quick voice recovery: malformed original alignment stores paid audio and explicit alignment resumes without TTS regeneration',async()=>{
 const id='quick-recover-'+randomUUID();
 try{
  const p=await initial(id);let tts=0,alignment=0;
  const request:typeof fetch=async(url,init)=>{
   if(String(url).endsWith('/forced-alignment')){
    alignment++;assert.ok(init?.body instanceof FormData);assert.equal(init.body.get('text'),script);
    const file=init.body.get('file');assert.ok(file instanceof Blob);assert.deepEqual(Buffer.from(await file.arrayBuffer()).subarray(44),pcm);
    return json(forcedAlignment());
   }
   tts++;return json({audio_base64:pcm.toString('base64'),alignment:null,normalized_alignment:originalAlignment()});
  };
  const result=await generateNarration(id,{voiceId:'fixture',revision:p.revision},config,request);
  const q=await load(id);assert.equal(result.needsAlignment,true);assert.equal(q.timingSource,'unverified');assert.equal(q.analysis,undefined);assert.equal(q.captions.length,0);assert.equal(q.scenes.length,0);assert.ok(q.audio);
  assert.throws(()=>draftStoryboard(q));assert.deepEqual([tts,alignment],[1,0]);
  const repaired=await alignNarration(id,q.revision,config,request);
  assert.equal(repaired.audio,q.audio);assert.equal(repaired.timingSource,'elevenlabs-align');assert.equal(repaired.analysis?.status,'matched');
  assertStoryboardReady(await load(id));assert.deepEqual([tts,alignment],[1,1]);
 }finally{await clean(id);}
});
test('quick voice guard: overlapping paid request rejected; stale response cannot overwrite newer saved script',async()=>{
 const id='quick-race-'+randomUUID();
 let release:()=>void=()=>{};
 try{
  const p=await initial(id);let calls=0;let started:()=>void=()=>{};
  const entered=new Promise<void>(resolve=>{started=resolve;});
  const gate=new Promise<void>(resolve=>{release=resolve;});
  const request:typeof fetch=async()=>{calls++;started();await gate;return json({audio_base64:pcm.toString('base64'),alignment:originalAlignment()});};
  const pending=generateNarration(id,{voiceId:'fixture',revision:p.revision},config,request);
  // Attach rejection handling immediately; response deliberately completes after an edit.
  const rejected=assert.rejects(pending);
  await entered;
  try{
   await assert.rejects(()=>generateNarration(id,{voiceId:'fixture',revision:p.revision},config,request));
   assert.equal(calls,1);
   const newer=await save({...p,script:'새롭게 수정한 대본입니다.'});
   release();await rejected;
   const current=await load(id);assert.equal(current.revision,newer.revision);assert.equal(current.script,newer.script);assert.equal(current.audio,null);
   await assert.rejects(()=>generateNarration(id,{voiceId:'fixture',revision:p.revision},config,request));assert.equal(calls,1);
  }finally{release();await rejected.catch(()=>{});}
 }finally{release();await clean(id);}
});
test('quick voice provider failure preserves script-only project and makes no automatic retry',async()=>{
 const id='quick-provider-'+randomUUID();
 try{
  const p=await initial(id);let calls=0;
  const request:typeof fetch=async()=>{calls++;return new Response('fixture rate limit',{status:429});};
  await assert.rejects(()=>generateNarration(id,{voiceId:'fixture',revision:p.revision},config,request),/429/);
  const q=await load(id);assert.equal(q.revision,p.revision);assert.equal(q.script,script);assert.equal(q.audio,null);assert.deepEqual(q.creativeBrief,brief);assert.equal(q.styleId,'kinetic');assert.equal(calls,1);
 }finally{await clean(id);}
});

import {runQuick} from '../server/quick-create';
import {fixtureScript,mockQuickRequest} from './fixtures/quick-provider';
const quickInput={topic:'반도체 공정',brief:{...emptyBrief,purpose:'반도체 공정 설명'},styleId:'editorial',voice:{voiceId:'fixture'},consent:true};
const quickConfig={directorApiKey:'fixture-only',apiKey:'fixture-only'};
test('actual runQuick rejects exact digital silence before upload, never retries or renders',async()=>{
 let id:string|undefined,voiceCalls=0,renderCalls=0;
 const mock=mockQuickRequest();
 const request:typeof fetch=async(url,init)=>{
  if(String(url).includes('/with-timestamps')){
   voiceCalls++;const response=await mock.request(url,init);const data=await response.json();
   return json({...data,audio_base64:Buffer.alloc(4*24000*2).toString('base64')});
  }
  return mock.request(url,init);
 };
 try{
  await assert.rejects(()=>runQuick(quickInput,quickConfig,(_s,_n,p)=>{if(p)id=p;},{request,render:async()=>{renderCalls++;throw new Error('must not render');}}),/소리가 없습니다/);
  assert.ok(id);const p=await load(id);
  assert.equal(p.script,fixtureScript);assert.equal(p.audio,null);assert.equal(p.timingSource,'unverified');assert.equal(p.scenes.length,0);
  assert.deepEqual(mock.calls,['script','voice']);assert.equal(voiceCalls,1);assert.equal(renderCalls,0);
 }finally{if(id)await clean(id);}
});
test('actual runQuick alignment failure leaves recoverable project; explicit alignment and compiler reuse identical PCM',async()=>{
 let id:string|undefined,renderCalls=0,alignCalls=0;
 const mock=mockQuickRequest({badTiming:true});const stages:string[]=[];
 try{
  await assert.rejects(()=>runQuick(quickInput,quickConfig,(s,_n,p)=>{stages.push(s);if(p)id=p;},{request:mock.request,render:async()=>{renderCalls++;throw new Error('must not render');}}),/타이밍/);
  assert.ok(id);const p=await load(id);assert.ok(p.audio);assert.equal(p.timingSource,'unverified');assert.equal(p.scenes.length,0);assert.deepEqual(stages,['script','voice']);
  const original=await readFile(path.join(root,'public',p.audio));
  const request:typeof fetch=async(url,init)=>{
   assert.ok(String(url).endsWith('/forced-alignment'));alignCalls++;
   assert.ok(init?.body instanceof FormData);assert.equal(init.body.get('text'),fixtureScript);
   const blob=init.body.get('file');assert.ok(blob instanceof Blob);assert.deepEqual(Buffer.from(await blob.arrayBuffer()),original);
   return json({words:fixtureScript.split(/\s+/).map((text,i)=>({text,start:i*.45,end:i*.45+.38})),loss:.1});
  };
  const q=await alignNarration(id,p.revision,quickConfig,request);assert.equal(q.audio,p.audio);assert.equal(q.analysis?.status,'matched');
  const draft=draftStoryboard(q);
  const board:Storyboard={version:1,projectId:q.id,baseRevision:q.revision,styleId:'editorial',theme:demo.theme,direction:{author:'agent',concept:'회로 설명',audience:'일반',style:'에디토리얼',plan:{message:'회로의 모양',narrative:'회로와 빛',visualApproach:'핵심 단어',constraints:'원문 유지',referenceDecisions:[]}},beats:draft.captionEvidence.map((c,i)=>({captionIds:[c.id],purpose:'개념 전달',metaphor:'회로',headline:'작은 회로',kicker:String(i+1),detail:'빛으로 새기기',visual:{type:'focus',word:'회로'}}))};
  const compiled=compileStoryboard(q,board);assertRequestInputs(q,compiled);assert.deepEqual(validate(compiled).errors,[]);assert.ok(compiled.scenes.length>0);
  assert.deepEqual(await readFile(path.join(root,'public',compiled.audio!)),original);
  assert.deepEqual(mock.calls,['script','voice']);assert.equal(alignCalls,1);assert.equal(renderCalls,0);
 }finally{if(id)await clean(id);}
});
test('actual runQuick invalid storyboard preserves matched voice without render or automatic retry',async()=>{
 let id:string|undefined,renderCalls=0;const mock=mockQuickRequest({badBoard:true});const stages:string[]=[];
 try{
  await assert.rejects(()=>runQuick(quickInput,quickConfig,(s,_n,p)=>{stages.push(s);if(p)id=p;},{request:mock.request,render:async()=>{renderCalls++;throw new Error('must not render');}}),/자막 구간/);
  assert.ok(id);const p=await load(id);assert.ok(p.audio);assert.equal(p.analysis?.status,'matched');assert.equal(p.timingSource,'elevenlabs-tts');assert.equal(p.scenes.length,0);assert.ok(p.captions.length);
  assert.deepEqual(mock.calls,['script','voice','storyboard']);assert.deepEqual(stages,['script','voice','storyboard']);assert.equal(renderCalls,0);
 }finally{if(id)await clean(id);}
});
