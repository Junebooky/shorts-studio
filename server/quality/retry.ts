import path from 'node:path';
import {createHash} from 'node:crypto';
import {mkdir,open,realpath,rm} from 'node:fs/promises';
import {load,ready,root,idCheck} from '../storage';
import {productionReadiness} from '../../src/core/production';
import {frames,type Project} from '../../src/core/project';
import {renderRetryDraft} from '../render';
import {inspectQuality} from '../quality';
import {technicalPass} from '../../src/core/quality';
import {fingerprint,fullDecode} from './integrity';
import {checkCancelled} from './render-output';
export function assertRetryReady(p:Project,revision:number){
 if(p.id==='demo'||!Number.isSafeInteger(revision)||p.revision!==revision)throw new Error('현재 저장된 프로젝트 리비전이 필요해요.');
 if(!productionReadiness(p).board||p.analysis?.status!=='matched'||!p.audio)throw new Error('저장된 대본·음성·타이밍·스토리보드를 먼저 확인해 주세요.');
}
export async function retrySnapshot(id:string,revision:number){
 const p=await load(id);assertRetryReady(p,revision);await ready(p);
 if(!p.audio||!p.audio.startsWith('workspace/'+id+'/'))throw new Error('음성 경로가 일치하지 않아요.');
 const file=path.join(root,'public',p.audio),canonical=path.join(await realpath(root),'public',p.audio);
 if(await realpath(file)!==canonical)throw new Error('음성 파일 경로가 변경됐어요.');
 const audio=await fingerprint(file);const projectHash=createHash('sha256').update(JSON.stringify(p)).digest('hex');
 // ready verifies registered asset bytes and project structure on every snapshot.
 const again=await load(id);if(JSON.stringify(again)!==JSON.stringify(p))throw new Error('검사 중 프로젝트가 변경됐어요.');
 return {project:p,projectHash,audio};
}
export type RetrySnapshot=Awaited<ReturnType<typeof retrySnapshot>>;
export async function assertRetryCurrent(snapshot:RetrySnapshot){
 const current=await retrySnapshot(snapshot.project.id,snapshot.project.revision);
 if(current.projectHash!==snapshot.projectHash||current.audio.sha256!==snapshot.audio.sha256||current.audio.bytes!==snapshot.audio.bytes)throw new Error('제작 원본이 변경됐어요. 최신 프로젝트를 확인해 주세요.');
}
export async function withRetryLease<T>(id:string,fn:()=>Promise<T>){
 const dir=path.join(root,'out',idCheck(id),'retry-drafts');await mkdir(dir,{recursive:true});const lock=path.join(dir,'retry.lock');
 let lease;try{lease=await open(lock,'wx');}catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')throw new Error('이 프로젝트의 재렌더링이 진행 중이거나 중단됐어요.');throw e;}
 try{await lease.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));return await fn();}finally{try{await lease.close();}finally{await rm(lock,{force:true});}}
}
export async function retrySavedDraft(id:string,revision:number,progress:(n:number)=>void=()=>{},signal?:AbortSignal){
 checkCancelled(signal);
 return withRetryLease(id,async()=>{
  const snapshot=await retrySnapshot(id,revision);checkCancelled(signal);
  // No text/voice provider, no project save, no approval mutation.
  let file:string|undefined;
  try{
   file=await renderRetryDraft(snapshot.project,n=>progress(n*.95),signal,async()=>{checkCancelled(signal);await assertRetryCurrent(snapshot);});
   checkCancelled(signal);const quality=await inspectQuality(snapshot.project,file,undefined,'final',undefined,f=>fullDecode(f,signal));
   if(!technicalPass(quality)||quality.integrity?.decodedFrames!==frames(snapshot.project))throw new Error('재렌더링 영상의 무결성을 확인하지 못했어요.');
   await assertRetryCurrent(snapshot);checkCancelled(signal);
   const actual=await fingerprint(file);if(actual.sha256!==quality.integrity.sha256||actual.bytes!==quality.integrity.bytes)throw new Error('검사 후 출력 파일이 변경됐어요.');
   progress(1);return {projectId:id,revision,file,quality,source:{projectHash:snapshot.projectHash,audioHash:snapshot.audio.sha256},approval:'unreviewed_draft' as const};
  }catch(e){if(file)await rm(file,{force:true});throw e;}
 });
}
