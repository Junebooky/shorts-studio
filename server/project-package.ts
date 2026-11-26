import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,stat,rm} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {ProjectSchema,type Project} from '../src/core/project';
import {assetErrors} from '../src/core/assets';
import {detectAsset,verifyAssets} from './assets';
import {root,load,save,projectPath} from './storage';

const MiB=1024*1024, MAGIC=Buffer.from('SHORTS01'), MAX_HEADER=8*MiB;
export const MAX_PACKAGE_BYTES=244*MiB;
const Entry=z.object({path:z.string(),bytes:z.number().int().positive().max(50*MiB),sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
const Header=z.object({version:z.literal(1),project:ProjectSchema,files:z.array(Entry).max(101)}).strict();
const digest=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
function expected(p:Project){
 if(p.id==='demo')throw new Error('저장된 프로젝트만 지원합니다.');
 const errors=assetErrors(p);if(errors.length)throw new Error(errors.join('; '));
 const paths=new Map<string,{limit:number;bytes?:number;sha256?:string}>();
 if(p.audio){if(!p.audio.startsWith('workspace/'+p.id+'/'))throw new Error('음성 경로 오류');paths.set(p.audio,{limit:35*MiB});}
 for(const a of p.assets??[]){if(paths.has(a.path))throw new Error('소재 경로 중복');paths.set(a.path,{limit:50*MiB,bytes:a.bytes,sha256:a.sha256});}
 return paths;
}
function checkFile(rel:string,b:Buffer,meta:{limit:number;bytes?:number;sha256?:string}){
 if(!b.length||b.length>meta.limit||!detectAsset(b,rel.split('.').pop()!))throw new Error('지원하지 않는 파일 형식 또는 용량: '+rel);
 const sha256=digest(b);if(meta.bytes!==undefined&&(meta.bytes!==b.length||meta.sha256!==sha256))throw new Error('소재 무결성 오류: '+rel);
 return {path:rel,bytes:b.length,sha256};
}
export async function exportPackage(id:string,revision:number){
 const p=await load(id);if(p.revision!==revision)throw new Error('최신 저장 버전을 불러온 후 내보내세요.');
 await verifyAssets(p.id,p.assets);
 const entries: z.infer<typeof Entry>[]=[],buffers:Buffer[]=[];let size=0;
 for(const [rel,meta] of expected(p)){const file=path.join(root,'public',rel),s=await stat(file);if(!s.isFile()||s.size>meta.limit||size+s.size>235*MiB)throw new Error('백업 용량 제한 초과');const b=await readFile(file);entries.push(checkFile(rel,b,meta));size+=b.length;buffers.push(b);}
 const latest=await load(id);if(JSON.stringify(latest)!==JSON.stringify(p))throw new Error('백업 생성 중 프로젝트가 변경되었습니다.');
 const json=Buffer.from(JSON.stringify({version:1,project:p,files:entries}));if(json.length>MAX_HEADER||12+json.length+size>MAX_PACKAGE_BYTES)throw new Error('백업 용량 제한 초과');
 const prefix=Buffer.alloc(12);MAGIC.copy(prefix);prefix.writeUInt32BE(json.length,8);
 return Buffer.concat([prefix,json,...buffers]);
}
export function decodePackage(b:Buffer){
 if(b.length<12||b.length>MAX_PACKAGE_BYTES||!b.subarray(0,8).equals(MAGIC))throw new Error('지원하지 않는 Shorts Studio 백업 파일');
 const n=b.readUInt32BE(8);if(!n||n>MAX_HEADER||12+n>b.length)throw new Error('백업 헤더 오류');
 const header=Header.parse(JSON.parse(b.toString('utf8',12,12+n)));const paths=expected(header.project);
 if(header.files.length!==paths.size)throw new Error('백업 파일 목록 불일치');
 let offset=12+n;const files=new Map<string,Buffer>();
 for(const entry of header.files){const meta=paths.get(entry.path);if(!meta||files.has(entry.path)||offset+entry.bytes>b.length)throw new Error('백업 파일 누락 또는 중복');const data=b.subarray(offset,offset+entry.bytes);const check=checkFile(entry.path,data,meta);if(check.sha256!==entry.sha256||check.bytes!==entry.bytes)throw new Error('백업 파일 무결성 오류');files.set(entry.path,data);offset+=entry.bytes;}
 if(offset!==b.length)throw new Error('백업 파일 크기 불일치');return {project:header.project,files};
}
export async function restorePackage(b:Buffer){
 const {project:p,files}=decodePackage(b),id=randomUUID(),prefix='workspace/'+p.id+'/',nextPrefix='workspace/'+id+'/';
 const remap=(rel:string)=>{if(!rel.startsWith(prefix))throw new Error('백업 경로 오류');return nextPrefix+rel.slice(prefix.length);};
 const audio=p.audio?remap(p.audio):null;
 const analysis=p.analysis&&p.analysis.sourceAudio===p.audio?{...p.analysis,sourceAudio:audio}:undefined;
 const next=ProjectSchema.parse({...p,id,revision:0,title:(p.title.slice(0,90)+' (복구)'),audio,analysis,...(p.assets?{assets:p.assets.map(a=>({...a,path:remap(a.path)}))}:{})});
 const mediaDir=path.join(root,'public','workspace',id),projectDir=path.dirname(projectPath(id));
 await mkdir(path.dirname(mediaDir),{recursive:true});await mkdir(mediaDir);
 try{for(const [rel,data] of files){const dest=path.join(root,'public',remap(rel));await mkdir(path.dirname(dest),{recursive:true});await writeFile(dest,data,{flag:'wx'});}return await save(next);}
 catch(e){await rm(mediaDir,{recursive:true,force:true});await rm(projectDir,{recursive:true,force:true});throw e;}
}
