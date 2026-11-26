import {list,load} from './storage';
import {getTask,taskRequest} from './agent-store';
import {agentAdvance,productionState} from './production';
import {assertRequestInputs} from '../src/core/task-inputs';
import {terminal,type AgentTask} from '../src/core/agent-task';
import {verifyAssets} from './assets';
type Item={projectId:string;taskId:string;kind:AgentTask['kind'];stage:AgentTask['stage'];baseRevision:number;revision:number;createdAt:string;updatedAt:string;queued:boolean;revisionCurrent:boolean};
function summary(task:AgentTask,revision:number):Item{return {projectId:task.projectId,taskId:task.id,kind:task.kind,stage:task.stage,baseRevision:task.baseRevision,revision,createdAt:task.createdAt,updatedAt:task.updatedAt,queued:task.stage==='queued',revisionCurrent:task.baseRevision===revision};}
export async function inbox(){
 const entries:Item[]=[],unavailable:string[]=[];
 for(const p of await list()){if(p.id==='demo')continue;try{const t=await getTask(p.id);if(t&&t.projectId!==p.id)throw new Error('Task project mismatch');if(t&&!terminal(t.stage))entries.push(summary(t,p.revision));}catch{unavailable.push(p.id);}}
 entries.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.taskId.localeCompare(b.taskId));
 return {version:1,entries,unavailable,mode:'manual-local' as const};
}
export async function inspectTask(id:string,taskId:string){
 const p=await load(id),t=await getTask(id);
 if(!t||t.id!==taskId||t.projectId!==id||terminal(t.stage))throw new Error('현재 진행 가능한 작업 ID를 확인해 주세요.');
 const item=summary(t,p.revision),reasons:string[]=[];
 if(!item.queued)reasons.push('not_queued');
 if(!item.revisionCurrent)reasons.push('revision_changed');
 try{const request=await taskRequest(id,taskId);if(request.revision!==t.baseRevision)throw new Error('Request revision mismatch');assertRequestInputs(request.projectSnapshot,p);await verifyAssets(id,p.assets);}catch{reasons.push('request_or_assets_changed');}
 try{const s=await productionState(p);if(!s.voiceApproved)reasons.push('voice_review_missing');if(!s.readiness.timing)reasons.push('timing_not_ready');}catch{reasons.push('project_evidence_unavailable');}
 // This is a snapshot only. agentAdvance performs authoritative audio/hash and revision checks under the task lock.
 return {...item,canAttemptClaim:reasons.length===0,reasons,requestPath:'workspace/projects/'+id+'/production/agent/'+taskId+'-request.json'};
}
export async function claimTask(id:string,taskId:string,notes:string){
 const check=await inspectTask(id,taskId);
 if(!check.canAttemptClaim)throw new Error('작업 착수 조건 미충족: '+check.reasons.join(', '));
 const task=await agentAdvance(id,taskId,'working',check.revision,notes);
 return {projectId:id,taskId:task.id,revision:task.revision,stage:task.stage,requestPath:check.requestPath,mode:'manual-local' as const};
}
