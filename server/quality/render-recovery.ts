import {hostname} from 'node:os';
import {open,readFile,rm,stat} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
export const RenderLease=z.object({version:z.literal(1),pid:z.number().int().positive(),host:z.string().min(1),startedAt:z.string().datetime(),temporary:z.string()});
export type RenderLease=z.infer<typeof RenderLease>;
function validTemporary(destination:string,name:string){const prefix='.'+path.basename(destination,'.mp4')+'-';return name.startsWith(prefix)&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.partial\.mp4$/.test(name.slice(prefix.length));}
export function makeLease(temporary:string):RenderLease{return {version:1,pid:process.pid,host:hostname(),startedAt:new Date().toISOString(),temporary:path.basename(temporary)};}
function pidStatus(pid:number){try{process.kill(pid,0);return 'live' as const;}catch(e){return (e as NodeJS.ErrnoException).code==='ESRCH'?'dead' as const:'unknown' as const;}}
export async function inspectRenderLock(destination:string){
 let raw:string;try{raw=await readFile(destination+'.render.lock','utf8');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {status:'unlocked' as const};throw e;}
 try{const lease=RenderLease.parse(JSON.parse(raw));if(lease.host!==hostname()||!validTemporary(destination,lease.temporary))return {status:'unverified' as const};const state=pidStatus(lease.pid);return {status:state==='dead'?'interrupted' as const:state==='live'?'active_or_reused_pid' as const:'unverified' as const,lease};}catch{return {status:'unverified' as const};}
}
export async function recoverRender(destination:string,offlineConfirmed:boolean){
 if(!offlineConfirmed)throw new Error('복구하기 전에 스튜디오 서버, CLI와 하위 영상 생성 프로세스가 모두 종료됐는지 확인해 주세요.');
 // Serialize recovery attempts. An abandoned guard is deliberately not auto-removed.
 const guard=destination+'.recovery.lock';const handle=await open(guard,'wx');
 try{
  const state=await inspectRenderLock(destination);
  if(state.status!=='interrupted'||!('lease' in state)||!state.lease)throw new Error('이 기기에서 중단된 작업인지 확인할 수 없어요. 안전을 위해 잠금 파일은 그대로 유지해요.');
  const tmp=path.join(path.dirname(destination),state.lease.temporary);
  // Only the recorded sibling temp file, never the published MP4.
  await rm(tmp,{force:true});
  await rm(destination+'.render.lock');
  const previous=await stat(destination).then(s=>s.isFile()&&s.size>0,e=>{if((e as NodeJS.ErrnoException).code==='ENOENT')return false;throw e;});
  return {status:'recovered' as const,previousOutputExists:previous};
 }finally{try{await handle.close();}finally{await rm(guard,{force:true});}}
}
