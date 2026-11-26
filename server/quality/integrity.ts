import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {root} from '../storage';
const exec=promisify(execFile);
export function decodedFrames(stdout:string){
 const lines=stdout.split(/\r?\n/);
 if(!lines.some(l=>l.trim()==='progress=end'))throw new Error('디코딩 완료 기록이 없어요.');
 const values=lines.flatMap(l=>{const m=/^frame=\s*(\d+)\s*$/.exec(l);return m?[Number(m[1])]:[];});
 if(!values.length||!Number.isSafeInteger(values[values.length-1]))throw new Error('디코딩 프레임 수를 확인할 수 없어요.');
 return values[values.length-1];
}
export async function fullDecode(file:string,signal?:AbortSignal){
 const cli=path.join(root,'node_modules','@remotion','cli','remotion-cli.js');
 // Decode all mapped video/audio samples; no output file, no network, no shell.
 const {stdout,stderr}=await exec(process.execPath,[cli,'ffmpeg','-nostdin','-v','error','-xerror','-err_detect','explode','-i',file,'-map','0:v:0','-map','0:a:0?','-fps_mode','passthrough','-progress','pipe:1','-nostats','-f','null','-'],{cwd:root,timeout:300000,maxBuffer:4*1024*1024,windowsHide:true,signal});
 // FFmpeg -xerror should return nonzero on decoding error. Treat unexpected stderr conservatively.
 if(stderr.trim())throw new Error('디코딩 오류 또는 진단 메시지가 있어요: '+stderr.trim().slice(0,200));
 return decodedFrames(stdout);
}
export async function fingerprint(file:string){
 const before=await stat(file);if(!before.isFile()||!before.size)throw new Error('영상 파일이 없거나 비어 있어요.');
 const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);
 const after=await stat(file);
 if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino||before.dev!==after.dev)throw new Error('검사 중 영상 파일이 변경됐어요.');
 return {bytes:after.size,sha256:h.digest('hex')};
}
