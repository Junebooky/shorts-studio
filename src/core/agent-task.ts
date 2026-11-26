import {z} from 'zod';
export const AgentStage=z.enum(['queued','working','storyboard-ready','review-ready','blocked','completed','cancelled']);
export type AgentStage=z.infer<typeof AgentStage>;
export const AgentTask=z.object({id:z.string().uuid(),projectId:z.string(),baseRevision:z.number().int(),revision:z.number().int(),stage:AgentStage,kind:z.enum(['produce','revision']),feedback:z.string().max(2000),createdAt:z.string(),updatedAt:z.string(),events:z.array(z.object({stage:AgentStage,revision:z.number().int(),at:z.string(),notes:z.string().min(1).max(2000)})).min(1).max(200)});
export type AgentTask=z.infer<typeof AgentTask>;
export const terminal=(s:AgentStage)=>s==='completed'||s==='cancelled';
const transitions:Record<AgentStage,AgentStage[]>={queued:['working','cancelled'],working:['storyboard-ready','blocked','cancelled'],'storyboard-ready':['review-ready','working','blocked','cancelled'],'review-ready':['completed','working','blocked','cancelled'],blocked:['working','cancelled'],completed:[],cancelled:[]};
export function nextTask(task:AgentTask,stage:AgentStage,revision:number,notes:string,at:string){if(!transitions[task.stage].includes(stage))throw new Error('허용되지 않는 작업 상태 변경');if(revision<task.revision)throw new Error('이전 프로젝트 리비전으로 돌아갈 수 없습니다');return AgentTask.parse({...task,stage,revision,updatedAt:at,events:[...task.events,{stage,revision,at,notes:notes.trim()}]});}
