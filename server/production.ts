import {createHash,randomUUID} from 'node:crypto';
import {readFile,writeFile,rename,mkdir,stat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {load,projectPath,root,ready} from './storage';
import {productionReadiness,type ProductionState} from '../src/core/production';
import {draftStoryboard} from '../src/core/storyboard';
import {styleInstruction} from '../src/core/styles';
import {validate,type Project} from '../src/core/project';
const Approval=z.object({key:z.string(),reviewer:z.enum(['user','agent']),notes:z.string().min(1).max(2000),at:z.string()});
const Report=z.object({key:z.string(),revision:z.number(),at:z.string()});
const Request=z.object({key:z.string(),revision:z.number()});
const hash=(x:string|Buffer)=>createHash('sha256').update(x).digest('hex');
function folder(p:Project){return path.join(path.dirname(projectPath(p.id)),'production');}
async function read<T>(p:Project,name:string,schema:z.ZodType<T>){try{return schema.parse(JSON.parse(await readFile(path.join(folder(p),name),'utf8')));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return undefined;throw e;}}
async function write(p:Project,name:string,data:unknown){const dir=folder(p);await mkdir(dir,{recursive:true});const dest=path.join(dir,name),tmp=dest+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(data,null,2));await rename(tmp,dest);}
async function audioKey(p:Project){if(!p.audio)return '';if(!p.audio.startsWith('workspace/'+p.id+'/'))throw new Error('음성 경로 오류');return hash(JSON.stringify([p.script,p.audio,p.durationMs,hash(await readFile(path.join(root,'public',p.audio)))]));}
async function engineKey(){const h=createHash('sha256');async function visit(dir:string){for(const e of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const x=path.join(dir,e.name);if(e.isDirectory())await visit(x);else if(e.isFile()&&/\.(ts|tsx|css|json)$/.test(e.name)){h.update(path.relative(root,x));h.update(await readFile(x));}}}for(const dir of ['src/core','src/engine','src/remotion','src/vendor'])await visit(path.join(root,dir));h.update(await readFile(path.join(root,'package-lock.json')));h.update(await readFile(path.join(root,'server/render.ts')));return h.digest('hex');}
async function reviewKey(p:Project,voiceKey:string){return hash(JSON.stringify([p,voiceKey,await engineKey()]));}
const previewPath=(p:Project)=>path.join(root,'out',p.id,'r'+p.revision+'-preview.mp4');
const framesPath=(p:Project)=>path.join(root,'out',p.id,'review','r'+p.revision,'frames');
async function exists(file:string){try{return (await stat(file)).size>0;}catch{return false;}}
export async function productionState(p:Project):Promise<ProductionState>{
 const readiness=productionReadiness(p);
 if(p.id==='demo'||!readiness.voice)return {revision:p.revision,readiness,voiceApproved:false,requestPrepared:false,reviewReady:false,reviewApproved:false,finalReady:false};
 let vk='';try{vk=await audioKey(p);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 const voice=await read(p,'voice-review.json',Approval),request=await read(p,'request.json',Request);
 const voiceApproved=!!vk&&voice?.key===vk;
 const key=readiness.board&&voiceApproved?await reviewKey(p,vk):'';
 const report=await read(p,'render-review.json',Report),approval=await read(p,'visual-review.json',Approval);
 const reviewReady=!!key&&report?.key===key&&await exists(previewPath(p));
 const reviewApproved=reviewReady&&approval?.key===key;
 return {revision:p.revision,readiness:{...readiness,voice:readiness.voice&&!!vk,timing:readiness.timing&&!!vk,board:readiness.board&&!!vk},voiceApproved,requestPrepared:voiceApproved&&readiness.timing&&request?.revision===p.revision&&request.key===vk,reviewReady,reviewApproved,finalReady:reviewApproved};
}
async function current(id:string,revision:number){const p=await load(id);if(id==='demo'||p.revision!==revision)throw new Error('저장된 최신 프로젝트가 필요합니다.');return p;}
const notes=(s:string)=>z.string().trim().min(1).max(2000).parse(s);
export async function approveVoice(id:string,revision:number,comment:string,reviewer:'user'|'agent'='user'){const p=await current(id,revision);if(!productionReadiness(p).voice)throw new Error('대본과 음성이 필요합니다.');const key=await audioKey(p);await write(p,'voice-review.json',{key,reviewer,notes:notes(comment),at:new Date().toISOString()});return productionState(p);}
export async function prepareRequest(id:string,revision:number){const p=await current(id,revision);const s=await productionState(p);if(!s.voiceApproved||!s.readiness.timing)throw new Error('음성 청취 확인 및 최신 타이밍이 필요합니다.');const request={key:await audioKey(p),revision:p.revision,projectId:p.id,createdAt:new Date().toISOString(),instruction:'단일 메인 에이전트로 AGENTS.md 및 .agents/skills/produce-short/SKILL.md에 따라 제작. 사용자 스타일을 유지하고 대본 의미를 시각화. 실제 발화와 타이밍 검수, 구조화된 스토리보드 적용, 검수용 렌더링 및 실제 프레임/영상 청취, 문제 수정, 재검수. 미확인 품질은 통과로 기록하지 않는다. 외부 유료 호출은 별도 승인.',styleGuide:styleInstruction(p.styleId),draft:draftStoryboard(p)};await write(p,'request.json',request);return {path:'workspace/projects/'+p.id+'/production/request.json',command:'workspace/projects/'+p.id+'/production/request.json을 읽고 저장된 최신 리비전으로 단일 에이전트 제작을 수행해. docs/PRODUCTION_PIPELINE.md를 따라 실제 검수까지 진행해.'};}
export async function prepareReview(p:Project,progress:(n:number)=>void,renderImpl?:{render:typeof import('./render').render;stills:typeof import('./render').stills}){const s=await productionState(p);if(!s.voiceApproved||!s.readiness.board)throw new Error('승인된 음성, 최신 타이밍 및 스토리보드가 필요합니다.');await ready(p);const key=await reviewKey(p,await audioKey(p));const m=renderImpl??await import('./render');const file=await m.render(p,n=>progress(n*.8),.5);await m.stills(p,framesPath(p));if(!await exists(file)||!await exists(previewPath(p)))throw new Error('검수용 MP4 누락');if((await load(p.id)).revision!==p.revision||await reviewKey(p,await audioKey(p))!==key)throw new Error('검수 렌더링 중 프로젝트 또는 엔진 변경. 다시 실행하세요.');await write(p,'render-review.json',{key,revision:p.revision,at:new Date().toISOString(),preview:path.relative(root,file),frames:path.relative(root,framesPath(p)),validation:validate(p)});progress(1);return file;}
export async function approveVisual(id:string,revision:number,comment:string,reviewer:'user'|'agent'='user'){const p=await current(id,revision);if(!(await productionState(p)).reviewReady)throw new Error('현재 리비전의 실제 검수용 영상이 필요합니다.');await write(p,'visual-review.json',{key:await reviewKey(p,await audioKey(p)),reviewer,notes:notes(comment),at:new Date().toISOString()});return productionState(p);}
export async function approvedPreview(id:string){const p=await load(id);if(!(await productionState(p)).reviewReady)throw new Error('현재 검수 영상 없음');return previewPath(p);}
export async function requireFinal(p:Project){if(!(await productionState(p)).finalReady)throw new Error('현재 영상의 음성 및 시각 검수 확인 후 최종 출력하세요.');}
