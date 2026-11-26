import assert from 'node:assert/strict';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {runQuick} from '../server/quick-create';
import {root} from '../server/storage';
import {stills} from '../server/render';
import {emptyBrief} from '../src/core/creative-brief';
import {vectorScenes,vectorScript} from '../tests/fixtures/vector-motion';
import {newSharedContent,captureVideoSource} from '../src/workspace/shared-content';
import {createContentPlan} from '../src/workspace/content-plan';
import {defaultBrandKit} from '../src/workspace/brand-kit';
import {videoToCard} from '../src/workspace/video-to-card';
import {randomUUID} from 'node:crypto';
const calls:string[]=[];
const chars=Array.from(vectorScript),step=.18,durationMs=Math.ceil((chars.length*step+.4)*1000),pcm=Buffer.alloc(Math.ceil(durationMs*24)*2);
for(let i=0;i<pcm.length/2;i++)pcm.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*210/24000)*1800),i*2);
const alignment={characters:chars,character_start_times_seconds:chars.map((_,i)=>i*step),character_end_times_seconds:chars.map((_,i)=>(i+1)*step)};
const request:typeof fetch=async(url,init)=>{
 const body=JSON.parse(String(init?.body));
 if(String(url).includes('/chat/completions')){
  const data=JSON.parse(body.messages[1].content);
  if(!data.draft){calls.push('script');return Response.json({choices:[{message:{content:JSON.stringify({title:'원자력 발전소의 원리',script:vectorScript})}}]});}
  calls.push('storyboard');assert.ok(body.messages[0].content.includes('bespoke vector'));assert.equal(body.max_completion_tokens,16000);const {captionEvidence,wordEvidence}=data.draft;assert.equal(captionEvidence.length,3);
  const beats=captionEvidence.map((c:{id:string;startMs:number;endMs:number},i:number)=>{
   const words=wordEvidence.filter((w:{startMs:number;endMs:number})=>w.startMs>=c.startMs&&w.endMs<=c.endMs);assert.ok(words.length>=2);const w=words[1];
   return {captionIds:[c.id],purpose:'작동 원리를 보여줘요.',metaphor:vectorScenes[i].subject,headline:['원자로의 열','증기와 터빈','전기 에너지'][i],kicker:'발전 원리',detail:['열이 발생해요','회전 에너지가 전달돼요','전기가 만들어져요'][i],layout:'editorial',visual:vectorScenes[i],cues:[{slot:0,wordIndex:w.index,expectedWord:w.text}]};
  });
  return Response.json({choices:[{message:{content:JSON.stringify({direction:{concept:'발전 원리',audience:'일반인',style:'교육용 개념도'},theme:{background:'#101B34',foreground:'#F8FAFC',accent:'#7DD3FC'},beats})}}]});
 }
 if(String(url).includes('/with-timestamps')){calls.push('voice');assert.equal(body.text,vectorScript);return Response.json({audio_base64:pcm.toString('base64'),alignment});}throw Error('Unexpected network request');
};
const theme={background:'#101B34',foreground:'#F8FAFC',accent:'#7DD3FC'};
const q=await runQuick({topic:'원자력 발전소의 원리',brief:emptyBrief,styleId:'auto',brandPalette:theme,voice:{voiceId:'fixture'},consent:true},{apiKey:'fixture',directorApiKey:'fixture'},(s,n)=>console.log(s,Math.round(n*100)),{request});
assert.deepEqual(calls,['script','voice','storyboard']);assert.deepEqual(q.project.scenes.map(s=>s.visual),vectorScenes);assert.deepEqual(q.project.theme,theme);for(const s of q.project.scenes)for(const c of s.cues!)assert.equal(c.startMs,q.project.analysis!.words[c.wordIndex].startMs);
const record=captureVideoSource(newSharedContent(randomUUID(),createContentPlan('발전 원리',['video','card']),defaultBrandKit),q.project);const deck=videoToCard(record,randomUUID);assert.deepEqual(deck.pages.filter(p=>p.visual).map(p=>p.visual),vectorScenes);
const out=path.join(root,'out','vector-motion-evidence');await mkdir(out,{recursive:true});await copyFile(q.file,path.join(out,'vector-demo.mp4'));await stills(q.project,path.join(out,'stills'));await writeFile(path.join(out,'report.json'),JSON.stringify({fixture:true,provider:'mock text, synthetic tone and timing, not real AI art or speech',calls,scenes:q.project.scenes,deck,quality:q.quality},null,2));console.log('Three custom vector scenes rendered and source geometry reused.');
