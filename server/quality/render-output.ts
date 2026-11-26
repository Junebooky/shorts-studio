import {randomUUID} from 'node:crypto';
import {open,rename,rm,stat} from 'node:fs/promises';
import path from 'node:path';
export class RenderCancelled extends Error{constructor(){super('렌더링이 취소되었습니다.');this.name='RenderCancelled';}}
export function checkCancelled(signal?:AbortSignal){if(signal?.aborted)throw new RenderCancelled();}
export async function publishRender(destination:string,write:(temporary:string)=>Promise<void>,signal?:AbortSignal){
 checkCancelled(signal);
 const lock=destination+'.render.lock';
 // Exclusive across CLI/server processes. Never remove a lock belonging to another writer.
 let lease;try{lease=await open(lock,'wx');}catch(e){if((e as NodeJS.ErrnoException).code==='EEXIST')throw new Error('이 출력 경로에서 렌더링이 진행 중이거나 이전 작업이 중단됐어요. 작업 상태를 확인해 주세요.');throw e;}
 const temporary=path.join(path.dirname(destination),'.'+path.basename(destination,'.mp4')+'-'+randomUUID()+'.partial.mp4');
 try{
  checkCancelled(signal);await write(temporary);checkCancelled(signal);
  if(!(await stat(temporary)).size)throw new Error('렌더링 결과 파일이 비어 있어요.');
  checkCancelled(signal);
  // Commit point: after rename, cancellation is too late. Preserve existing output on all pre-commit failures.
  await rename(temporary,destination);
  return destination;
 }catch(e){if(signal?.aborted)throw new RenderCancelled();throw e;}
 finally{try{await rm(temporary,{force:true});}finally{try{await lease.close();}finally{await rm(lock,{force:true});}}}
}
