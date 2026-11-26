import {createHash,randomUUID} from 'node:crypto';
import {readFile,writeFile,rename,mkdir,stat,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {z} from 'zod';
import {load,projectPath,root,ready} from './storage';
import {productionReadiness,type ProductionState} from '../src/core/production';
import {draftStoryboard} from '../src/core/storyboard';
import {styleInstruction} from '../src/core/styles';
import {createTask,getTask,updateTask} from './agent-store';
import {AgentStage,terminal} from '../src/core/agent-task';
import {validate,type Project} from '../src/core/project';
const Approval=z.object({key:z.string(),reviewer:z.enum(['user','agent']),notes:z.string().min(1).max(2000),at:z.string()});
const Report=z.object({key:z.string(),revision:z.number(),at:z.string(),artifact:z.string().optional(),runId:z.string().optional()});
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
async function artifactKey(p:Project){try{const file=previewPath(p),dir=framesPath(p);if(!(await stat(file)).size)return '';const names=(await readdir(dir)).filter(n=>/^\d+\.png$/.test(n)).sort();if(!names.length)return '';const h=createHash('sha256');h.update(await readFile(file));for(const name of names){const bytes=await readFile(path.join(dir,name));if(!bytes.length)return '';h.update(name);h.update(bytes);}return h.digest('hex');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return '';throw e;}}
const approvalKey=(r:{key:string;artifact?:string;runId?:string})=>hash(JSON.stringify([r.key,r.artifact,r.runId]));
export async function productionState(p:Project):Promise<ProductionState>{
 const readiness=productionReadiness(p);
 if(p.id==='demo'||!readiness.voice)return {revision:p.revision,readiness,voiceApproved:false,requestPrepared:false,reviewReady:false,reviewApproved:false,finalReady:false};
 let vk='';try{vk=await audioKey(p);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 const voice=await read(p,'voice-review.json',Approval),request=await read(p,'request.json',Request);
 const voiceApproved=!!vk&&voice?.key===vk;
 const key=readiness.board&&voiceApproved?await reviewKey(p,vk):'';
 const report=await read(p,'render-review.json',Report),approval=await read(p,'visual-review.json',Approval);
 const reviewReady=!!key&&report?.key===key&&!!report.artifact&&!!report.runId&&await artifactKey(p)===report.artifact;
 const reviewApproved=!!(reviewReady&&report&&approval?.key===approvalKey(report));
 const task=await getTask(p.id);const finalReady=reviewApproved&&(!task||terminal(task.stage));
 return {revision:p.revision,readiness:{...readiness,voice:readiness.voice&&!!vk,timing:readiness.timing&&!!vk,board:readiness.board&&!!vk},voiceApproved,requestPrepared:voiceApproved&&readiness.timing&&request?.revision===p.revision&&request.key===vk,reviewReady,reviewApproved,finalReady};
}
async function current(id:string,revision:number){const p=await load(id);if(id==='demo'||p.revision!==revision)throw new Error('저장된 최신 프로젝트가 필요합니다.');return p;}
const notes=(s:string)=>z.string().trim().min(1).max(2000).parse(s);
export async function approveVoice(id:string,revision:number,comment:string,reviewer:'user'|'agent'='user'){const p=await current(id,revision);if(!productionReadiness(p).voice)throw new Error('대본과 음성이 필요합니다.');const key=await audioKey(p);await write(p,'voice-review.json',{key,reviewer,notes:notes(comment),at:new Date().toISOString()});return productionState(p);}
export async function prepareRequest(id:string,revision:number,feedback?:string){const p=await current(id,revision);const s=await productionState(p);if(!s.voiceApproved||!s.readiness.timing)throw new Error('음성 청취 확인 및 최신 타이밍이 필요합니다.');const feedbackText=feedback===undefined?'':notes(feedback);if(feedbackText&&!s.reviewReady)throw new Error('현재 검수 영상이 있어야 수정 요청을 만들 수 있습니다.');const request={key:await audioKey(p),revision:p.revision,projectId:p.id,createdAt:new Date().toISOString(),instruction:'단일 메인 에이전트로 AGENTS.md 및 .agents/skills/produce-short/SKILL.md에 따라 제작. 사용자 스타일을 유지하고 대본 의미를 시각화. 실제 발화와 타이밍 검수, 구조화된 스토리보드 적용, 검수용 렌더링 및 실제 프레임/영상 청취, 문제 수정, 재검수. 미확인 품질은 통과로 기록하지 않는다. 외부 유료 호출은 별도 승인.',styleGuide:styleInstruction(p.styleId),draft:draftStoryboard(p)};const task=await createTask(id,revision,feedbackText?'revision':'produce',feedbackText,request,async()=>{if(feedbackText){await rm(path.join(folder(p),'render-review.json'),{force:true});await rm(path.join(folder(p),'visual-review.json'),{force:true});}await write(p,'request.json',request);});return taskHandoff(task);}
export async function prepareReview(p:Project,progress:(n:number)=>void,renderImpl?:{render:typeof import('./render').render;stills:typeof import('./render').stills}){const s=await productionState(p);if(!s.voiceApproved||!s.readiness.board)throw new Error('승인된 음성, 최신 타이밍 및 스토리보드가 필요합니다.');await ready(p);const key=await reviewKey(p,await audioKey(p));const m=renderImpl??await import('./render');await rm(path.join(folder(p),'render-review.json'),{force:true});await rm(framesPath(p),{recursive:true,force:true});const file=await m.render(p,n=>progress(n*.8),.5);await m.stills(p,framesPath(p));const artifact=await artifactKey(p);if(!artifact||path.resolve(file)!==previewPath(p))throw new Error('검수용 MP4 또는 프레임 누락');if((await load(p.id)).revision!==p.revision||await reviewKey(p,await audioKey(p))!==key)throw new Error('검수 렌더링 중 프로젝트 또는 엔진 변경. 다시 실행하세요.');await write(p,'render-review.json',{key,artifact,runId:randomUUID(),revision:p.revision,at:new Date().toISOString(),preview:path.relative(root,file),frames:path.relative(root,framesPath(p)),validation:validate(p)});progress(1);return file;}
export async function approveVisual(id:string,revision:number,comment:string,reviewer:'user'|'agent'='user'){const p=await current(id,revision);if(!(await productionState(p)).reviewReady)throw new Error('현재 리비전의 실제 검수용 영상이 필요합니다.');const report=await read(p,'render-review.json',Report);if(!report)throw new Error('검수 기록 없음');await write(p,'visual-review.json',{key:approvalKey(report),reviewer,notes:notes(comment),at:new Date().toISOString()});return productionState(p);}
export async function approvedPreview(id:string){const p=await load(id);if(!(await productionState(p)).reviewReady)throw new Error('현재 검수 영상 없음');return previewPath(p);}
export async function requireFinal(p:Project){if(!(await productionState(p)).finalReady)throw new Error('현재 영상의 음성 및 시각 검수 확인 후 최종 출력하세요.');}

export async function renderFinal(p:Project,progress:(n:number)=>void){await requireFinal(p);const file=await (await import('./render')).render(p,progress);const latest=await load(p.id);if(latest.revision!==p.revision)throw new Error('최종 렌더링 중 프로젝트 변경');await requireFinal(latest);return file;}

function taskHandoff(task:NonNullable<Awaited<ReturnType<typeof getTask>>>){const file='workspace/projects/'+task.projectId+'/production/agent/'+task.id+'-request.json';return {task,path:file,command:file+' 을 읽고 docs/AGENT_BRIDGE.md에 따라 작업 ID '+task.id+' 로 단일 메인 에이전트 제작을 수행해. 실제 수행 단계마다 CLI로 기록하고 수정 요청을 반영해.'};}
export async function agentStatus(id:string){const task=await getTask(id);return task?taskHandoff(task):null;}
export async function agentAdvance(id:string,taskId:string,stageInput:unknown,revision:number,comment:string){const stage=AgentStage.parse(stageInput);const p=await current(id,revision);return updateTask(id,taskId,stage,revision,notes(comment),async()=>{const task=await getTask(id);if(!task||terminal(task.stage))throw new Error('종료 작업');if(stage==='working'&&task.stage==='queued'&&task.baseRevision!==revision)throw new Error('요청 이후 프로젝트가 변경되었습니다. 취소 후 새 요청을 준비하세요.');if(stage==='storyboard-ready'||stage==='review-ready'||stage==='completed'){const s=await productionState(p);if(!s.readiness.board||!s.voiceApproved)throw new Error('유효한 스토리보드 및 음성 확인 필요');if((stage==='review-ready'||stage==='completed')&&!s.reviewReady)throw new Error('실제 검수 렌더 필요');}});}
