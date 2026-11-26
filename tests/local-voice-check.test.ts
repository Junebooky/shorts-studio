import {test} from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {rm} from 'node:fs/promises';
import {SAMPLE,voiceCheckPlan,runLocalVoiceCheck} from '../scripts/local-voice-check';
import {load,root} from '../server/storage';
const env={ELEVENLABS_API_KEY:'secret-fixture-key',ELEVENLABS_VOICE_ID:'fixture-voice'};
const flags=['--execute','--accept-provider-cost'];
const chars=Array.from(SAMPLE),pcm=Buffer.alloc((chars.length+2)*2400*2);
for(let i=0;i<pcm.length;i+=2)pcm.writeInt16LE(i%4===0?200:-200,i);
const alignment={characters:chars,character_start_times_seconds:chars.map((_,i)=>i/10),character_end_times_seconds:chars.map((_,i)=>(i+1)/10)};
async function cleanup(id:string|undefined){if(id){await rm(path.join(root,'workspace','projects',id),{recursive:true,force:true});await rm(path.join(root,'public','workspace',id),{recursive:true,force:true});}}
test('offline default dry run never calls provider and never prints credentials or voice ID',async()=>{
 let calls=0;
 const r=await runLocalVoiceCheck([],env,true,async()=>{calls++;throw Error('unexpected request');});
 assert.equal(r.status,'dry-run');assert.equal(r.externalCalls,0);assert.equal(calls,0);
 assert.equal(voiceCheckPlan([],{},false).ready,false);
 assert.equal(voiceCheckPlan([],env,false).ready,true);
 const serialized=JSON.stringify(r);assert.ok(!serialized.includes(env.ELEVENLABS_API_KEY));assert.ok(!serialized.includes(env.ELEVENLABS_VOICE_ID));
});
test('execute requires both flags, configured credentials, and no CI; unknown flags rejected',()=>{
 for(const args of [['--execute'],['--accept-provider-cost'],['--unexpected'],['--execute','--execute']])assert.throws(()=>voiceCheckPlan(args,env,false));
 assert.throws(()=>voiceCheckPlan(flags,env,true));assert.throws(()=>voiceCheckPlan(flags,{},false));assert.throws(()=>voiceCheckPlan(flags,{...env,ELEVENLABS_VOICE_ID:'invalid/path'},false));
});
test('explicit mock execution makes one TTS call, persists a matched voice draft without approval',async()=>{
 let id:string|undefined;let calls=0;
 try{
  const r=await runLocalVoiceCheck(flags,env,false,async(url,init)=>{calls++;assert.equal(String(url),'https://api.elevenlabs.io/v1/text-to-speech/fixture-voice/with-timestamps?output_format=pcm_24000');assert.equal(new Headers(init?.headers).get('xi-api-key'),env.ELEVENLABS_API_KEY);assert.equal(JSON.parse(String(init?.body)).text,SAMPLE);return Response.json({audio_base64:pcm.toString('base64'),alignment});});
  if('projectId'in r)id=r.projectId;
  assert.equal(r.status,'matched');assert.equal(calls,1);assert.equal(r.externalCalls,1);assert.ok(id);
  const p=await load(id);assert.equal(p.script,SAMPLE);assert.equal(p.analysis?.status,'matched');assert.equal(p.scenes.length,0);
  assert.ok('voiceApproved'in r&&!r.voiceApproved);assert.ok(!JSON.stringify(r).includes(env.ELEVENLABS_API_KEY));
 }finally{await cleanup(id);}
});
test('bad alignment preserves generated audio, no forced alignment or automatic TTS retry',async()=>{
 let id:string|undefined;let calls=0;
 try{
  const r=await runLocalVoiceCheck(flags,env,false,async()=>{calls++;return Response.json({audio_base64:pcm.toString('base64'),alignment:null});});
  if('projectId'in r)id=r.projectId;
  assert.equal(r.status,'needs-alignment');assert.equal(calls,1);assert.ok(id);
  const p=await load(id);assert.ok(p.audio);assert.equal(p.timingSource,'unverified');assert.equal(p.scenes.length,0);
 }finally{await cleanup(id);}
});
test('provider rejection returns redacted failure with saved draft ID and no retry',async()=>{
 let id:string|undefined;let calls=0;
 try{
  const r=await runLocalVoiceCheck(flags,env,false,async()=>{calls++;return new Response('private response '+env.ELEVENLABS_API_KEY,{status:429});});
  if('projectId'in r)id=r.projectId;
  assert.equal(r.status,'failed');assert.equal(calls,1);assert.equal(r.externalCalls,1);assert.ok(id);assert.ok(!JSON.stringify(r).includes(env.ELEVENLABS_API_KEY));assert.equal((await load(id)).audio,null);
 }finally{await cleanup(id);}
});
