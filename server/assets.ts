import {mkdir,writeFile,stat,mkdtemp,rm,realpath} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {z} from 'zod';
import {AssetSchema,AssetRole,type Asset} from '../src/core/assets';
const root=process.cwd(),run=promisify(execFile);
const Upload=z.object({name:z.string().trim().min(1).max(150),role:AssetRole,durationMs:z.number().int().positive().max(3600000).optional(),ext:z.enum(['png','jpg','jpeg','webp','mp4','wav','mp3'])});
const Probe=z.object({format:z.object({format_name:z.string(),duration:z.string().optional()}),streams:z.array(z.object({codec_type:z.string(),duration:z.string().optional(),disposition:z.object({attached_pic:z.number().optional()}).optional()}))});
export function detectAsset(buffer:Buffer,ext:string){const ascii=(a:number,b:number)=>buffer.subarray(a,b).toString('ascii');switch(ext){case 'png':return buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));case 'jpg':case 'jpeg':return buffer[0]===255&&buffer[1]===216&&buffer[2]===255;case 'webp':return ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP';case 'wav':return ascii(0,4)==='RIFF'&&ascii(8,12)==='WAVE';case 'mp3':return ascii(0,3)==='ID3'||(buffer[0]===255&&(buffer[1]&224)===224);case 'mp4':return ascii(4,8)==='ftyp';default:return false;}}
function kindFor(ext:string):Asset['kind']{return ext==='mp4'?'video':ext==='wav'||ext==='mp3'?'audio':'image';}
function checkId(id:string){if(!/^[a-zA-Z0-9-]{1,64}$/.test(id)||id==='demo')throw new Error('저장된 프로젝트 필요');}
export function measuredDuration(input:unknown,ext:'mp4'|'wav'|'mp3'):number{
 const p=Probe.parse(input),kind=kindFor(ext),format=p.format.format_name.split(',');
 if(!format.includes(ext))throw new Error('소재 컨테이너 형식 불일치');
 const candidates=p.streams.filter(s=>s.codec_type===kind&&s.disposition?.attached_pic!==1);
 if(!candidates.length)throw new Error('소재에 필요한 영상/음성 스트림이 없습니다.');
 // Conservative duration: no extension past either container or relevant stream.
 const positive=(x:string|undefined)=>{const n=Number(x);return Number.isFinite(n)&&n>0?n:undefined;};
 const container=positive(p.format.duration),stream=positive(candidates[0].duration);
 const available=[container,stream].filter((n):n is number=>n!==undefined);
 const ms=available.length?Math.floor(Math.min(...available)*1000):0;
 if(ms<1||ms>3600000)throw new Error('소재 길이 1시간 이내 확인 필요');
 return ms;
}
async function probeFile(file:string,ext:'mp4'|'wav'|'mp3'){
 let stdout:string;
 try{
  ({stdout}=await run('ffprobe',['-v','error','-protocol_whitelist','file','-show_entries','format=format_name,duration:stream=codec_type,duration:stream_disposition=attached_pic','-of','json',file],{timeout:10000,maxBuffer:1024*1024,encoding:'utf8',windowsHide:true}));
 }catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw new Error('영상/음성 소재 확인을 위해 로컬 ffprobe 설치가 필요합니다.');throw new Error('소재 미디어 정보 확인 실패 또는 시간 초과');}
 try{return measuredDuration(JSON.parse(stdout),ext);}catch{throw new Error('소재 형식, 스트림 또는 재생 길이를 확인하지 못했습니다.');}
}
async function probeBuffer(buffer:Buffer,ext:'mp4'|'wav'|'mp3'){
 const dir=await mkdtemp(path.join(tmpdir(),'shorts-asset-'));
 try{const file=path.join(dir,'input.'+ext);await writeFile(file,buffer,{flag:'wx'});return await probeFile(file,ext);}finally{await rm(dir,{recursive:true,force:true});}
}
export async function uploadAsset(projectId:string,meta:unknown,buffer:Buffer){
 checkId(projectId);const m=Upload.parse(meta);
 if(!buffer.length||buffer.length>50*1024*1024||!detectAsset(buffer,m.ext))throw new Error('소재 파일 형식 또는 용량 오류 (최대 50MB)');
 const id=randomUUID(),ext=m.ext==='jpeg'?'jpg':m.ext,kind=kindFor(ext);
 // Browser duration is only a legacy hint; the actual local file is authoritative.
 const durationMs=ext==='mp4'||ext==='wav'||ext==='mp3'?await probeBuffer(buffer,ext):undefined;
 const rel='workspace/'+projectId+'/assets/'+id+'.'+ext;
 const a=AssetSchema.parse({id,path:rel,name:m.name,kind,role:m.role,bytes:buffer.length,sha256:createHash('sha256').update(buffer).digest('hex'),durationMs,notes:''});
 const dest=path.join(root,'public',rel);await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,buffer,{flag:'wx'});return a;
}
export async function verifyAssets(id:string,assets:Asset[]=[]){
 if(!assets.length)return;
 checkId(id);const canonicalRoot=await realpath(root),dir=path.resolve(canonicalRoot,'public','workspace',id,'assets');
 for(const input of assets){
  const a=AssetSchema.parse(input),ext=a.path.split('.').pop()!;
  if(a.path!=='workspace/'+id+'/assets/'+a.id+'.'+ext||a.kind!==kindFor(ext))throw new Error('다른 프로젝트 소재 또는 형식 오류');
  const file=path.join(root,'public',a.path);
  let s;try{const actual=await realpath(file);if(actual!==path.join(dir,path.basename(file)))throw new Error('경로 변경');s=await stat(file);}catch{throw new Error('소재 원본 파일 또는 경로 확인 실패: '+a.name);}
  if(!s.isFile()||s.size!==a.bytes)throw new Error('소재 파일 크기 변경: '+a.name);
  const h=createHash('sha256');for await(const b of createReadStream(file))h.update(b);if(h.digest('hex')!==a.sha256)throw new Error('소재 파일 변경: '+a.name);
  if(ext==='mp4'||ext==='wav'||ext==='mp3'){
   const measured=await probeFile(file,ext);
   // Allow only small legacy browser/encoder rounding differences, never arbitrary durations.
   if(a.durationMs===undefined||Math.abs(a.durationMs-measured)>100)throw new Error('소재 길이 변경 또는 이전 메타데이터 오류: '+a.name+' · 다시 등록하세요.');
  }else if(a.durationMs!==undefined)throw new Error('이미지 소재 길이 오류: '+a.name);
 }
}
