import {createHash} from 'node:crypto';
import {constants,createWriteStream,createReadStream} from 'node:fs';
import {open,lstat,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Transform,type Writable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import type {ServerResponse} from 'node:http';
import {QualityReport,technicalPass} from '../../src/core/quality';
import {fingerprint} from './integrity';

export const MAX_VERIFIED_DOWNLOAD_BYTES=512*1024*1024;
type Digest={bytes:number;sha256:string};
export function requireVerifiedDigest(input:unknown,manifest?:Digest):Digest{
 const q=QualityReport.parse(input);
 const decode=q.checks.filter(c=>c.id==='decode');
 if(q.mode!=='final'||!technicalPass(q)||decode.length!==1||!decode[0].required||decode[0].status!=='pass'||!q.integrity||q.integrity.decodedFrames<=0)throw new Error('전체 영상 검사 기록이 필요해요. 다시 검사해 주세요.');
 const {bytes,sha256}=q.integrity;
 if(!Number.isSafeInteger(bytes)||bytes>MAX_VERIFIED_DOWNLOAD_BYTES)throw new Error('검증 다운로드 용량 한도를 초과했어요.');
 if(manifest&&(manifest.bytes!==bytes||manifest.sha256!==sha256))throw new Error('보관 기록과 영상 검사 기록이 일치하지 않아요.');
 return {bytes,sha256};
}
let active=0;
const MAX_ACTIVE=2;
// Paths and quality reports must come from trusted server job/archive records, never client payloads.
export async function prepareVerifiedDownload(file:string,quality:unknown,options:{manifest?:Digest;signal?:AbortSignal;tempRoot?:string}={}){
 const expected=requireVerifiedDigest(quality,options.manifest);
 options.signal?.throwIfAborted();
 if(active>=MAX_ACTIVE)throw new Error('다른 영상 다운로드를 마친 뒤 다시 시도해 주세요.');
 active++;let dir:string|undefined,disposed=false,started=false;
 async function dispose(){
  if(disposed)return;disposed=true;
  try{if(dir)await rm(dir,{recursive:true,force:true});}finally{active--;}
 }
 try{
  const before=await lstat(file);if(!before.isFile()||before.size!==expected.bytes)throw new Error('검사한 영상 파일과 크기가 일치하지 않아요.');
  dir=await mkdtemp(path.join(options.tempRoot??tmpdir(),'shorts-verified-'));
  const snapshot=path.join(dir,'video.mp4'),h=createHash('sha256');let bytes=0;
  const count=new Transform({transform(chunk:Buffer,_encoding,cb){
   bytes+=chunk.length;if(bytes>expected.bytes)return cb(new Error('영상 파일 크기가 변경됐어요.'));
   h.update(chunk);cb(null,chunk);
  }});
  const input=await open(file,constants.O_RDONLY|(process.platform==='win32'?0:constants.O_NOFOLLOW));
  try{
   const opened=await input.stat();
   if(!opened.isFile()||opened.size!==expected.bytes||opened.ino!==before.ino||opened.dev!==before.dev)throw new Error('검사한 영상 경로가 변경됐어요.');
   await pipeline(input.createReadStream({autoClose:false}),count,createWriteStream(snapshot,{flags:'wx',mode:0o600}),{signal:options.signal});
  }finally{await input.close();}
  if(bytes!==expected.bytes||h.digest('hex')!==expected.sha256)throw new Error('검사 이후 영상 파일이 변경됐어요. 다시 렌더링해 주세요.');
  const copied=await fingerprint(snapshot);
  if(copied.bytes!==expected.bytes||copied.sha256!==expected.sha256)throw new Error('다운로드 임시 파일 검증에 실패했어요.');
  options.signal?.throwIfAborted();
  return {...expected,async sendTo(destination:Writable,signal?:AbortSignal){
   if(disposed||started)throw new Error('다운로드는 한 번만 실행할 수 있어요.');
   started=true;
   try{await pipeline(createReadStream(snapshot),destination,{signal});}finally{await dispose();}
  },dispose};
 }catch(e){await dispose();throw e;}
}
// Pre-header errors propagate for the API to return JSON. Once headers are sent,
// never send a second response; close the stream and let the caller log failure.
export async function sendVerifiedMp4(res:ServerResponse,file:string,quality:unknown,options:{download?:boolean;manifest?:Digest;beforeSend?:()=>Promise<void>}={}){
 const controller=new AbortController(),abort=()=>{if(!res.writableFinished)controller.abort();};
 res.once('close',abort);
 let prepared:Awaited<ReturnType<typeof prepareVerifiedDownload>>|undefined;
 try{
  if(res.destroyed)controller.abort();
  prepared=await prepareVerifiedDownload(file,quality,{manifest:options.manifest,signal:controller.signal});
  await options.beforeSend?.();controller.signal.throwIfAborted();
  res.writeHead(200,{'Content-Type':'video/mp4','Content-Length':prepared.bytes,'Cache-Control':'no-store',...(options.download?{'Content-Disposition':'attachment; filename="short.mp4"'}:{})});
  await prepared.sendTo(res,controller.signal);return true;
 }catch(e){if(res.headersSent||res.destroyed){res.destroy();return false;}throw e;}
 finally{res.removeListener('close',abort);await prepared?.dispose();}
}
