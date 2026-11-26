import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {load,root} from '../storage';
import {productionState} from '../production';
import {technicalPass} from '../../src/core/quality';
import {buildCriticRequest,validateCriticResult,type CriticRequest} from '../../src/core/quality/critic';
export async function verifyCriticFrames(request:CriticRequest,dir:string){
 for(const proof of request.frames){
  const bytes=await readFile(path.join(dir,proof.frame+'.png'));
  if(createHash('sha256').update(bytes).digest('hex')!==proof.sha256)throw new Error('검수 이미지가 변경됐어요: '+proof.frame);
 }
}
export async function currentCriticRequest(id:string){
 const p=await load(id),s=await productionState(p);
 if(!s.reviewReady||!s.quality||!s.reviewRunId)throw new Error('현재 저장된 검수 영상이 필요해요.');
 const request=buildCriticRequest({projectId:p.id,revision:p.revision,runId:s.reviewRunId},s.quality,technicalPass(s.quality));
 const dir=path.join(root,'out',p.id,'review','r'+p.revision,'frames');
 await verifyCriticFrames(request,dir);
 const latest=await load(id),current=await productionState(latest);
 if(latest.revision!==p.revision||!current.reviewReady||current.reviewRunId!==request.runId)throw new Error('검수 중 프로젝트 또는 렌더링이 변경됐어요.');
 return {request,frameDirectory:path.relative(root,dir)};
}
export async function checkCurrentCriticResult(id:string,input:unknown){
 const {request}=await currentCriticRequest(id);
 return validateCriticResult(request,input);
}
