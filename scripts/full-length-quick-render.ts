import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {runQuick} from '../server/quick-create';
import {load,root} from '../server/storage';
import {emptyBrief} from '../src/core/creative-brief';
import {frames,FPS,validate} from '../src/core/project';
import {technicalPass} from '../src/core/quality';
import {normalizeSpeech} from '../src/core/timing';
import {productionState} from '../server/production';
const src=path.join(root,'workspace','full-length-voice-fixture'),out=path.join(root,'out','full-length-voice-fixture');
await mkdir(out,{recursive:true});
const metadata=JSON.parse(await readFile(path.join(src,'metadata.json'),'utf8')) as {script:string;durationMs:number;sampleRate:number;wordBoundaries:{text:string;startSample:number;endSample:number}[];alignment:unknown;source:string};
const pcm=await readFile(path.join(src,'narration.pcm'));
const calls:string[]=[],stages:{stage:string;progress:number}[]=[];
const response=(value:unknown)=>Response.json({choices:[{message:{content:JSON.stringify(value)}}]});
const visuals=[
 {type:'focus',word:'반도체'},
 {type:'path',labels:['웨이퍼','막','빛']},
 {type:'contrast',left:'필요한 부분',right:'불필요한 부분'},
 {type:'cycle',labels:['형성','연결','반복']},
 {type:'typography',lines:['회로','검사']},
 {type:'focus',word:'작은 층'}
];
const headlines=['작은 회로의 시작','웨이퍼에 모양을 새겨요','필요한 부분만 남겨요','층을 쌓고 연결해요','회로가 작동하는지 검사','기기의 핵심이 완성돼요'];
const request:typeof fetch=async(url,init)=>{
 const u=String(url),body=JSON.parse(String(init?.body));
 if(u==='https://api.openai.com/v1/chat/completions'){
  const data=JSON.parse(body.messages[1].content);
  if(!data.draft){calls.push('script');return response({title:'반도체 공정 합성 음성 테스트',script:metadata.script});}
  calls.push('storyboard');const captions=data.draft.captionEvidence as {id:string;text:string;startMs:number;endMs:number}[];
  assert.ok(captions.length>=6);assert.equal(normalizeSpeech(captions.map(c=>c.text).join('')),normalizeSpeech(metadata.script));
  // Six consecutive groups, preserving all caption evidence without invented times.
  const beats=Array.from({length:6},(_,i)=>({captionIds:captions.slice(Math.floor(i*captions.length/6),Math.floor((i+1)*captions.length/6)).map(c=>c.id),purpose:'공정 흐름 설명',metaphor:'단계별 개념 도식',headline:headlines[i],kicker:'0'+(i+1),detail:'작은 회로를 만드는 과정',visual:visuals[i]}));
  return response({direction:{concept:'반도체 공정 설명',audience:'일반 시청자',style:'에디토리얼',plan:{message:'작은 회로를 만드는 과정',narrative:'준비부터 검사까지',visualApproach:'단계별 도식',constraints:'합성 검증용 고정 대본만 사용',referenceDecisions:[]}},theme:{background:'#F5F0E6',foreground:'#24342F',accent:'#17665B'},beats});
 }
 if(u.startsWith('https://api.elevenlabs.io/')&&u.includes('/with-timestamps')){
  calls.push('voice');assert.equal(body.text,metadata.script);assert.equal(new Headers(init?.headers).get('xi-api-key'),'fixture-only');
  return Response.json({audio_base64:pcm.toString('base64'),alignment:metadata.alignment});
 }
 throw new Error('Unexpected fixture request');
};
let projectId:string|undefined;
try{
 const result=await runQuick({topic:'반도체 공정 설명',brief:{...emptyBrief,purpose:'반도체 공정을 쉽게 설명',audience:'일반 시청자'},styleId:'editorial',voice:{voiceId:'fixture'},consent:true},{directorApiKey:'fixture-only',apiKey:'fixture-only'},(stage,progress,id)=>{if(id)projectId=id;const last=stages.at(-1);if(last?.stage!==stage)stages.push({stage,progress});},{request});
 const p=await load(result.project.id);assert.deepEqual(calls,['script','voice','storyboard']);assert.equal(stages.at(-1)?.stage,'done');
 assert.equal(p.durationMs,metadata.durationMs);assert.ok(p.durationMs>=35000&&p.durationMs<=60000);assert.equal(p.analysis?.status,'matched');assert.equal(p.analysis?.coverage,1);assert.equal(p.scenes.length,6);assert.deepEqual(validate(p).errors,[]);
 assert.equal(p.analysis?.words.length,metadata.wordBoundaries.length);
 for(let i=0;i<metadata.wordBoundaries.length;i++){
  const a=metadata.wordBoundaries[i];const b:{text:string;startMs:number;endMs:number}=p.analysis!.words[i];assert.equal(b.text,a.text);assert.equal(b.startMs,Math.round(a.startSample/metadata.sampleRate*1000));assert.equal(b.endMs,Math.round(a.endSample/metadata.sampleRate*1000));
 }
 const wav=await readFile(path.join(root,'public',p.audio!));assert.deepEqual(wav.subarray(44),pcm);
 assert.ok(technicalPass(result.quality));const state=await productionState(p);assert.equal(state.finalReady,false);assert.equal(state.voiceApproved,false);
 await copyFile(result.file,path.join(out,'draft.mp4'));
 await writeFile(path.join(out,'report.json'),JSON.stringify({testOnly:true,source:metadata.source,sourcePcmSha256:createHash('sha256').update(pcm).digest('hex'),durationMs:p.durationMs,fps:FPS,expectedFrames:frames(p),wordCount:p.analysis?.words.length,captionCount:p.captions.length,scenes:p.scenes.map(s=>({startMs:s.startMs,endMs:s.endMs,visual:s.visual?.type})),calls,stages,quality:result.quality,voiceApproved:state.voiceApproved,finalReady:state.finalReady},null,2));
 console.log('Full length synthetic Korean quick render passed',p.durationMs,frames(p),p.scenes.length);
}catch(e){await writeFile(path.join(out,'failure.json'),JSON.stringify({projectId,calls,stages,error:e instanceof Error?e.message:String(e)},null,2));throw e;}
