import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {root} from '../storage';
const exec=promisify(execFile);
export function decodedFrames(stdout:string){
 const raw:unknown=JSON.parse(stdout);
 if(!raw||typeof raw!=='object'||!('streams' in raw)||!Array.isArray(raw.streams))throw new Error('영상이나 오디오를 읽은 검사 기록이 없어요.');
 const video=raw.streams.filter(s=>s?.codec_type==='video'),audio=raw.streams.filter(s=>s?.codec_type==='audio');
 const count=(s:{nb_read_frames?:unknown})=>{const value=String(s.nb_read_frames??'');if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<=0)throw new Error('실제로 읽을 수 있는 프레임 수를 확인하지 못했어요.');return Number(value);};
 if(video.length!==1)throw new Error('영상 파일에 영상 트랙이 정확히 하나 있어야 해요.');
 for(const s of audio)count(s);
 return count(video[0]);
}
export async function fullDecode(file:string,signal?:AbortSignal){
 const cli=path.join(root,'node_modules','@remotion','cli','remotion-cli.js');
 // -count_frames actually decodes frames, unlike nb_frames metadata or -count_packets.
 try{
  const {stdout,stderr}=await exec(process.execPath,[cli,'ffprobe','-v','error','-count_frames','-show_entries','stream=codec_type,nb_read_frames','-of','json',file],{cwd:root,timeout:300000,maxBuffer:4*1024*1024,windowsHide:true,signal});
  if(stderr.trim())throw new Error('영상을 읽는 중 오류 또는 진단 메시지가 발생했어요: '+stderr.trim().slice(0,200));
  return decodedFrames(stdout);
 }catch(e){const err=e as {stderr?:string;code?:unknown;message?:string};throw new Error('전체 프레임 검사를 완료하지 못했어요. 검사 결과: '+(err.stderr?.trim().slice(0,240)|| (err.code!==undefined?'종료 코드 '+String(err.code):err.message?.slice(0,200)||'검사 불가')));}
}
export async function fingerprint(file:string){
 const before=await stat(file);if(!before.isFile()||!before.size)throw new Error('영상 파일이 없거나 비어 있어요.');
 const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);
 const after=await stat(file);
 if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino||before.dev!==after.dev)throw new Error('검사하는 중 영상 파일이 바뀌었어요. 파일 상태를 확인해 주세요.');
 return {bytes:after.size,sha256:h.digest('hex')};
}
