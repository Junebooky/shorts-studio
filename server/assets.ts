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
function checkId(id:string){if(!/^[a-zA-Z0-9-]{1,64}$/.test(id)||id==='demo')throw new Error('편집할 프로젝트를 먼저 만들고 저장해 주세요.');}
export function measuredDuration(input:unknown,ext:'mp4'|'wav'|'mp3'):number{
 const p=Probe.parse(input),kind=kindFor(ext),format=p.format.format_name.split(',');
 if(!format.includes(ext))throw new Error('파일의 실제 형식이 확장자와 달라요. 파일 형식을 확인해 주세요.');
 const candidates=p.streams.filter(s=>s.codec_type===kind&&s.disposition?.attached_pic!==1);
 if(!candidates.length)throw new Error('파일에 필요한 영상이나 오디오 트랙이 없어요. 파일을 확인해 주세요.');
 // Conservative duration: no extension past either container or relevant stream.
 const positive=(x:string|undefined)=>{const n=Number(x);return Number.isFinite(n)&&n>0?n:undefined;};
 const container=positive(p.format.duration),stream=positive(candidates[0].duration);
 const available=[container,stream].filter((n):n is number=>n!==undefined);
 const ms=available.length?Math.floor(Math.min(...available)*1000):0;
 if(ms<1||ms>3600000)throw new Error('재생 시간이 1시간 이내인 파일을 추가해 주세요.');
 return ms;
}
async function probeFile(file:string,ext:'mp4'|'wav'|'mp3'){
 let stdout:string;
 try{
  ({stdout}=await run('ffprobe',['-v','error','-protocol_whitelist','file','-show_entries','format=format_name,duration:stream=codec_type,duration:stream_disposition=attached_pic','-of','json',file],{timeout:10000,maxBuffer:1024*1024,encoding:'utf8',windowsHide:true}));
 }catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw new Error('영상과 음성 파일을 확인하려면 이 기기에 FFmpeg의 ffprobe를 설치해 주세요.');throw new Error('파일 정보를 읽지 못했거나 확인 시간이 초과됐어요. 파일과 ffprobe 설치 상태를 확인해 주세요.');}
 try{return measuredDuration(JSON.parse(stdout),ext);}catch{throw new Error('파일 형식, 영상·오디오 트랙 또는 재생 시간을 확인할 수 없어요. 파일을 확인해 주세요.');}
}
async function probeBuffer(buffer:Buffer,ext:'mp4'|'wav'|'mp3'){
 const dir=await mkdtemp(path.join(tmpdir(),'shorts-asset-'));
 try{const file=path.join(dir,'input.'+ext);await writeFile(file,buffer,{flag:'wx'});return await probeFile(file,ext);}finally{await rm(dir,{recursive:true,force:true});}
}
export async function uploadAsset(projectId:string,meta:unknown,buffer:Buffer){
 checkId(projectId);const m=Upload.parse(meta);
 if(!buffer.length||buffer.length>50*1024*1024||!detectAsset(buffer,m.ext))throw new Error('파일 형식이 지원되지 않거나 용량이 올바르지 않아요. 비어 있지 않은 50MB 이하의 지원 파일을 추가해 주세요.');
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
  if(a.path!=='workspace/'+id+'/assets/'+a.id+'.'+ext||a.kind!==kindFor(ext))throw new Error('이 프로젝트의 소재가 아니거나 파일 형식이 올바르지 않아요. 소재를 확인해 주세요.');
  const file=path.join(root,'public',a.path);
  let s;try{const actual=await realpath(file);if(actual!==path.join(dir,path.basename(file)))throw new Error('경로 변경');s=await stat(file);}catch{throw new Error('소재 원본 파일이나 경로를 확인할 수 없어요. 확인할 파일: '+a.name);}
  if(!s.isFile()||s.size!==a.bytes)throw new Error('소재의 파일 크기가 바뀌었어요. 다시 추가해 주세요: '+a.name);
  const h=createHash('sha256');for await(const b of createReadStream(file))h.update(b);if(h.digest('hex')!==a.sha256)throw new Error('소재 원본이 바뀌었어요. 다시 추가해 주세요: '+a.name);
  if(ext==='mp4'||ext==='wav'||ext==='mp3'){
   const measured=await probeFile(file,ext);
   // Allow only small legacy browser/encoder rounding differences, never arbitrary durations.
   if(a.durationMs===undefined||Math.abs(a.durationMs-measured)>100)throw new Error('소재의 재생 시간이 바뀌었거나 이전 파일 정보가 올바르지 않아요: '+a.name+' · 다시 추가해 주세요.');
  }else if(a.durationMs!==undefined)throw new Error('이미지 소재에 잘못된 재생 시간 정보가 있어요. 다시 추가해 주세요: '+a.name);
 }
}
