import {test} from 'node:test';
import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {rm,writeFile} from 'node:fs/promises';import {spawnSync} from 'node:child_process';import path from 'node:path';
import {demo} from '../src/core/project';import {alignTranscript} from '../src/core/timing';import {pcmToWav} from '../server/elevenlabs';import {audioUpload,save,root} from '../server/storage';import {approveVoice,prepareRequest,agentAdvance,agentStatus} from '../server/production';import {inbox,inspectTask,claimTask} from '../server/agent-inbox';
test('explicit local inbox, read-only inspection, stale and duplicate claim rejection',async()=>{
 const ids:string[]=[];
 async function fixture(){const id='inbox-'+randomUUID();ids.push(id);const audio=await audioUpload(id,'wav',pcmToWav(Buffer.alloc(96000)).wav),script='테스트 전용 비공개 대본',durationMs=2000;const x=alignTranscript({script,audio,durationMs,source:'srt',segments:[{text:script,startMs:100,endMs:1800}]});const p=await save({...demo,id,revision:0,script,audio,durationMs,...x,timingSource:'srt',scenes:[],styleId:'minimal'});await approveVoice(id,p.revision,'fixture only');const req=await prepareRequest(id,p.revision);return {id,p,req};}
 try{
  const a=await fixture(),b=await fixture(),c=await fixture();
  const items=await inbox();assert.ok(items.entries.some(x=>x.taskId===a.req.task.id));assert.ok(!JSON.stringify(items).includes(a.p.script));
  const checked=await inspectTask(a.id,a.req.task.id);assert.equal(checked.canAttemptClaim,true);assert.equal(checked.requestPath,a.req.path);assert.equal((await agentStatus(a.id))?.task.stage,'queued');
  const command=spawnSync(process.execPath,['--import','tsx','scripts/agent-inbox.ts','inspect',a.id,a.req.task.id],{cwd:root,encoding:'utf8',timeout:30000});assert.equal(command.status,0,command.stderr);assert.equal(JSON.parse(command.stdout).canAttemptClaim,true);assert.ok(!command.stdout.includes(a.p.script));
  await assert.rejects(()=>inspectTask(a.id,b.req.task.id));
  await save({...b.p,title:'new saved revision'});assert.equal((await inspectTask(b.id,b.req.task.id)).canAttemptClaim,false);await assert.rejects(()=>claimTask(b.id,b.req.task.id,'stale'));assert.equal((await agentStatus(b.id))?.task.stage,'queued');
  await writeFile(path.join(root,'public',c.p.audio!),pcmToWav(Buffer.alloc(48000)).wav);assert.ok((await inspectTask(c.id,c.req.task.id)).reasons.includes('voice_review_missing'));await assert.rejects(()=>claimTask(c.id,c.req.task.id,'changed voice'));
  const results=await Promise.allSettled([claimTask(a.id,a.req.task.id,'fixture actual start'),claimTask(a.id,a.req.task.id,'duplicate')]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal((await agentStatus(a.id))?.task.stage,'working');assert.equal((await agentStatus(a.id))?.task.events.length,2);
  await assert.rejects(()=>claimTask(a.id,a.req.task.id,'duplicate again'));await agentAdvance(a.id,a.req.task.id,'cancelled',a.p.revision,'fixture only');assert.ok(!(await inbox()).entries.some(x=>x.taskId===a.req.task.id));await assert.rejects(()=>inspectTask(a.id,a.req.task.id));
 }finally{for(const id of ids)for(const d of [path.join(root,'workspace','projects',id),path.join(root,'public','workspace',id),path.join(root,'out',id)])await rm(d,{recursive:true,force:true});}
});
