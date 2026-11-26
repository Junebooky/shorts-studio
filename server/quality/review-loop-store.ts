import {createHash,randomUUID} from 'node:crypto';
import {mkdir,open,readFile,rename,rm,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {load,root,projectPath} from '../storage';
import type {Project} from '../../src/core/project';
import {currentCriticRequest} from './critic-current';
import {validateRevisionPlan} from '../../src/core/quality/revision';
import {inspectLoop,startLoop,prepareLoop,recordLoop,type ReviewLoop} from '../../src/core/quality/review-loop';
const hash=(value:string|Buffer)=>createHash('sha256').update(value).digest('hex');
export function protectedSourceHash(p:Project,audioHash:string|null){
 return hash(JSON.stringify({script:p.script,audio:p.audio,audioHash,durationMs:p.durationMs,timingSource:p.timingSource,captions:p.captions,analysis:p.analysis,styleId:p.styleId,referenceBrief:p.referenceBrief,music:p.music,sceneTiming:p.scenes.map(s=>[s.id,s.startMs,s.endMs])}));
}
async function current(id:string){
 const {request,frameDirectory}=await currentCriticRequest(id),p=await load(id);
 if(p.revision!==request.revision)throw new Error('프로젝트가 변경됐어요.');
 if(p.audio&&!p.audio.startsWith('workspace/'+p.id+'/'))throw new Error('음성 경로가 일치하지 않아요.');
 const sourceHash=protectedSourceHash(p,p.audio?hash(await readFile(path.join(root,'public',p.audio))):null);
 if((await load(id)).revision!==p.revision)throw new Error('프로젝트가 변경됐어요.');
 return {request,frameDirectory,sourceHash};
}
export function loopFile(id:string,loopId:string){
 return path.join(path.dirname(projectPath(id)),'production','quality-loops',z.string().uuid().parse(loopId)+'.json');
}
export async function readLoop(file:string){
 if((await stat(file)).size>64*1024*1024)throw new Error('반복 기록이 너무 커요.');
 return inspectLoop(JSON.parse(await readFile(file,'utf8')));
}
export async function writeLoop(file:string,loop:ReviewLoop,create=false){
 const json=JSON.stringify(loop,null,2);if(Buffer.byteLength(json)>64*1024*1024)throw new Error('반복 기록이 너무 커요.');
 await mkdir(path.dirname(file),{recursive:true});const tmp=file+'.'+randomUUID()+'.tmp';
 try{await writeFile(tmp,json,{flag:'wx'});if(create){await (await import('node:fs/promises')).link(tmp,file);}else await rename(tmp,file);}finally{await rm(tmp,{force:true});}
}
export async function withLoopLock<T>(file:string,fn:()=>Promise<T>){
 const lock=file+'.lock';const lease=await open(lock,'wx');
 try{return await fn();}finally{try{await lease.close();}finally{await rm(lock,{force:true});}}
}
export async function createCurrentLoop(id:string,input:unknown,maxRounds:number){
 const {request,sourceHash}=await current(id),{plan}=validateRevisionPlan(input);
 if(JSON.stringify(plan.baseline)!==JSON.stringify(request))throw new Error('현재 검수 실행에서 만든 수정 계획이 필요해요.');
 const state=startLoop(plan,sourceHash,maxRounds);await writeLoop(loopFile(id,state.loop.loopId),state.loop,true);return state;
}
export async function getCurrentLoop(id:string,loopId:string){
 const file=loopFile(id,loopId),state=await readLoop(file);
 if(state.loop.loopId!==loopId||state.loop.initial.baseline.projectId!==id)throw new Error('프로젝트 또는 반복 ID가 일치하지 않아요.');
 return state;
}
export async function prepareCurrentLoop(id:string,loopId:string){
 const state=await getCurrentLoop(id,loopId),{request,sourceHash,frameDirectory}=await current(id);
 return {...prepareLoop(state.loop,request,sourceHash),frameDirectory};
}
export async function recordCurrentLoop(id:string,loopId:string,input:unknown){
 const file=loopFile(id,loopId);return withLoopLock(file,async()=>{
  const state=await getCurrentLoop(id,loopId),{request,sourceHash}=await current(id);
  const next=recordLoop(state.loop,request,input,sourceHash);await writeLoop(file,next.loop);return next;
 });
}
