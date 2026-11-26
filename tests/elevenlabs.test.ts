import {test} from 'node:test';import assert from 'node:assert/strict';
import {characterSegments,forcedSegments} from '../src/core/elevenlabs';import {pcmToWav,elevenClient,decodeSpeechPcm} from '../server/elevenlabs';import {alignTranscript} from '../src/core/timing';
test('character timings produce word anchors from original script',()=>{const text='작은 선택. 시작';const chars=Array.from(text);const a={characters:chars,character_start_times_seconds:chars.map((_,i)=>i*.1),character_end_times_seconds:chars.map((_,i)=>(i+1)*.1)};const s=characterSegments(a,text);assert.equal(s.length,2);assert.equal(s[0].words?.[1].text,'선택.');assert.equal(s[0].words?.[1].startMs,300);assert.equal(alignTranscript({script:text,audio:'workspace/x/a.wav',durationMs:2000,source:'elevenlabs-tts',segments:s}).analysis.coverage,1);assert.throws(()=>characterSegments(a,'다른 원문'));});
test('forced alignment uses supplied word timings',()=>{const x=forcedSegments({words:[{text:'작은',start:.1,end:.5,loss:.1},{text:'선택',start:.6,end:1.1,loss:.1}],loss:.1},'작은 선택');assert.equal(x.segments[0].words?.[1].startMs,600);assert.throws(()=>forcedSegments({words:[{text:'다름',start:0,end:1}]},'원문'));});
test('PCM wraps without retiming and measures duration',()=>{const x=pcmToWav(Buffer.alloc(48000));assert.equal(x.durationMs,1000);assert.equal(x.wav.readUInt32LE(24),24000);assert.equal(x.wav.readUInt32LE(40),48000);});
test('mock API passes credential only in official request header; no retries',async()=>{let count=0;const mock:typeof fetch=async(url,init)=>{count++;assert.equal(String(url),'https://api.elevenlabs.io/v1/text-to-speech/voice/with-timestamps?output_format=pcm_24000');assert.equal(new Headers(init?.headers).get('xi-api-key'),'test-only');assert.equal(JSON.parse(String(init?.body)).text,'안녕');return new Response(JSON.stringify({audio_base64:'AA==',alignment:null}));};await elevenClient({apiKey:'test-only'},mock).speech('안녕',{voiceId:'voice'});assert.equal(count,1);await assert.rejects(()=>elevenClient({},mock).speech('안녕',{voiceId:'voice'}));assert.equal(count,1);});

import {randomUUID} from 'node:crypto';
import {rm,readFile} from 'node:fs/promises';
import path from 'node:path';
import {demo} from '../src/core/project';
import {load,save,root} from '../server/storage';
import {generateNarration,alignNarration} from '../server/elevenlabs';
test('mock voice-first pipeline stores original PCM, measured duration and anchors, then aligns existing audio',async()=>{
 const id='mock-'+randomUUID(),script='작은 선택. 시작';
 const initial=await save({...demo,id,revision:0,script,audio:null,captions:[],scenes:[],timingSource:'unverified'});
 try{
  const chars=Array.from(script);const pcm=Buffer.alloc(96000);for(let i=0;i<pcm.length;i+=2)pcm.writeInt16LE(i%100, i);
  let calls=0;const mock:typeof fetch=async(url,init)=>{calls++;assert.equal(new Headers(init?.headers).get('xi-api-key'),'test-only');
   if(String(url).endsWith('/forced-alignment')){assert.ok(init?.body instanceof FormData);assert.equal(init.body.get('text'),script);return new Response(JSON.stringify({words:[{text:'작은',start:.1,end:.3},{text:'선택.',start:.4,end:.7},{text:'시작',start:1,end:1.4}],loss:.1}));}
   return new Response(JSON.stringify({audio_base64:pcm.toString('base64'),alignment:{characters:chars,character_start_times_seconds:chars.map((_,i)=>i*.15),character_end_times_seconds:chars.map((_,i)=>(i+1)*.15)}}));
  };
  const q=await generateNarration(id,{revision:initial.revision,voiceId:'mockvoice'},{apiKey:'test-only'},mock);
  assert.equal(q.needsAlignment,false);assert.equal(q.project.durationMs,2000);assert.equal(q.project.timingSource,'elevenlabs-tts');assert.equal(q.project.analysis?.coverage,1);assert.equal(q.project.analysis?.words.length,3);
  const wav=await readFile(path.join(root,'public',q.project.audio!));assert.deepEqual(wav.subarray(44),pcm);
  const aligned=await alignNarration(id,q.project.revision,{apiKey:'test-only'},mock);
  assert.equal(aligned.audio,q.project.audio);assert.equal(aligned.analysis?.words[1].startMs,400);assert.equal(aligned.timingSource,'elevenlabs-align');assert.equal(calls,2);
  await assert.rejects(()=>generateNarration(id,{revision:initial.revision,voiceId:'mockvoice'},{apiKey:'test-only'},mock));assert.equal(calls,2);
  const bad:typeof fetch=async()=>new Response(JSON.stringify({audio_base64:pcm.toString('base64'),alignment:null}));
  const unverified=await generateNarration(id,{revision:aligned.revision,voiceId:'mockvoice'},{apiKey:'test-only'},bad);
  assert.equal(unverified.needsAlignment,true);assert.equal(unverified.project.timingSource,'unverified');assert.equal(unverified.project.captions.length,0);
  assert.equal((await load(id)).revision,unverified.project.revision);
  const malformed:typeof fetch=async()=>new Response(JSON.stringify({audio_base64:pcm.toString('base64'),alignment:{characters:['가'],character_start_times_seconds:['bad']}}));
  const preserved=await generateNarration(id,{revision:unverified.project.revision,voiceId:'mockvoice'},{apiKey:'test-only'},malformed);
  assert.equal(preserved.needsAlignment,true);assert.equal(preserved.project.timingSource,'unverified');assert.equal(preserved.project.captions.length,0);
  assert.deepEqual((await readFile(path.join(root,'public',preserved.project.audio!))).subarray(44),pcm);
  const invalid:typeof fetch=async()=>new Response(JSON.stringify({audio_base64:'AA!A='}));
  await assert.rejects(()=>generateNarration(id,{revision:preserved.project.revision,voiceId:'mockvoice'},{apiKey:'test-only'},invalid));
  assert.equal((await load(id)).revision,preserved.project.revision);
 }finally{await rm(path.join(root,'workspace','projects',id),{recursive:true,force:true});await rm(path.join(root,'public','workspace',id),{recursive:true,force:true});}
});

test('reject malformed or non-canonical audio base64 before PCM wrapping',()=>{
 assert.deepEqual(decodeSpeechPcm('AAA='),Buffer.alloc(2));
 for(const bad of ['','AA!A=','A===','AAA','AAB=','AAAA\n'])assert.throws(()=>decodeSpeechPcm(bad));
 assert.throws(()=>pcmToWav(decodeSpeechPcm('AA==')));
});
test('raw timing overlap cannot disappear through rounding',()=>{
 assert.throws(()=>characterSegments({characters:['가','나'],character_start_times_seconds:[0,.1001],character_end_times_seconds:[.1004,.2]},'가나'),/겹침/);
 assert.throws(()=>forcedSegments({words:[{text:'가',start:0,end:.1004},{text:'나',start:.1001,end:.2}]},'가 나'),/겹침/);
});
test('HTTP and malformed JSON failures are sanitized, never retried or redirected',async()=>{
 for(const response of [new Response('private-body',{status:429}),new Response('private-body')]){
  let calls=0;
  const mock:typeof fetch=async(_url,init)=>{calls++;assert.equal(init?.redirect,'error');return response;};
  await assert.rejects(()=>elevenClient({apiKey:'test-only'},mock).speech('테스트',{voiceId:'voice'}),e=>e instanceof Error&&!e.message.includes('private-body')&&!e.message.includes('test-only'));
  assert.equal(calls,1);
 }
});
