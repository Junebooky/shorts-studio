import {createHash,randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,copyFile,writeFile,readFile,rename,rm,readdir,stat} from 'node:fs/promises';
import path from 'node:path';import {z} from 'zod';
import {FinalArtifact} from '../src/core/production-library';
import {technicalPass,type QualityReport} from '../src/core/quality';
import type {Project} from '../src/core/project';
import {idCheck,root} from './storage';
const base=(id:string)=>path.join(root,'out',idCheck(id),'final-library');
const folder=(id:string,artifactId:string)=>path.join(base(id),z.string().uuid().parse(artifactId));
async function digest(file:string){const h=createHash('sha256');let bytes=0;for await(const b of createReadStream(file)){h.update(b);bytes+=b.length;}return {bytes,sha256:h.digest('hex')};}
export async function archiveFinal(p:Project,file:string,reviewRunId:string,quality:QualityReport,review:{reviewer:'user'|'agent';notes:string;at:string},verify:()=>Promise<void>){
 if(p.id==='demo'||quality.mode!=='final'||!technicalPass(quality))throw new Error('최종 출력 기술 검사 필요');
 const id=randomUUID(),dest=folder(p.id,id),tmp=dest+'.tmp';await mkdir(base(p.id),{recursive:true});await mkdir(tmp);
 try{
  const target=path.join(tmp,'video.mp4');await copyFile(file,target);
  const info=await digest(target);const source=await digest(file);if(info.sha256!==source.sha256||info.bytes!==source.bytes)throw new Error('출력 파일 복사 중 변경');
  const record=FinalArtifact.parse({version:1,id,projectId:p.id,revision:p.revision,reviewRunId,createdAt:new Date().toISOString(),title:p.title,...info,reviewer:review.reviewer,testFixture:p.direction?.author==='fixture'});
  await writeFile(path.join(tmp,'manifest.json'),JSON.stringify(record,null,2));await writeFile(path.join(tmp,'quality.json'),JSON.stringify(quality,null,2));await writeFile(path.join(tmp,'review.json'),JSON.stringify(review,null,2));
  await verify();await rename(tmp,dest);return {record,file:path.join(dest,'video.mp4')};
 }finally{await rm(tmp,{recursive:true,force:true});}
}
async function manifest(id:string,artifactId:string){const record=FinalArtifact.parse(JSON.parse(await readFile(path.join(folder(id,artifactId),'manifest.json'),'utf8')));if(record.projectId!==id||record.id!==artifactId)throw new Error('보관 기록 불일치');return record;}
export async function listFinals(id:string){let names:string[];try{names=await readdir(base(id));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e;}const entries=await Promise.all(names.filter(n=>z.string().uuid().safeParse(n).success).map(async n=>{const record=await manifest(id,n);let available=false;try{available=(await stat(path.join(folder(id,n),'video.mp4'))).size===record.bytes;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}return {...record,available};}));return entries.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id)).slice(0,50);}
export async function finalFile(id:string,artifactId:string){const record=await manifest(id,artifactId),file=path.join(folder(id,artifactId),'video.mp4'),actual=await digest(file);if(actual.bytes!==record.bytes||actual.sha256!==record.sha256)throw new Error('보관 영상이 변경되어 다운로드할 수 없습니다.');return {record,file};}
