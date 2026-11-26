import {z} from 'zod';
import {CriticRequest,type CriticRequest as Request,type CriticResult} from './critic';
import {RevisionPlan,RecheckResult,validateRevisionPlan,validateRecheck,buildRecheckRequest,type RevisionPlan as Plan} from './revision';
const Hash=z.string().regex(/^[0-9a-f]{64}$/);
const Round=z.object({current:CriticRequest,result:RecheckResult,nextPlanId:z.string().uuid()});
export const ReviewLoop=z.object({version:z.literal(1),loopId:z.string().uuid(),sourceHash:Hash,maxRounds:z.number().int().min(1).max(5),initial:RevisionPlan,rounds:z.array(Round).max(5)});
export type ReviewLoop=z.infer<typeof ReviewLoop>;
export type LoopStatus='awaiting_revision'|'manual_review'|'technical_blocked'|'uncertain'|'no_progress'|'round_limit';
function nextPlan(plan:Plan,current:Request,result:z.infer<typeof RecheckResult>,planId:string):Plan{
 const tasks=validateRevisionPlan(plan).tasks;
 const rows=result.tasks.filter(t=>t.status==='persists');
 const critique:CriticResult={version:1,projectId:current.projectId,revision:current.revision,runId:current.runId,scenes:current.scenes.scenes.map(s=>{
  const items=rows.flatMap(row=>{const task=tasks.find(t=>t.id===row.id)!;return task.sceneId===s.sceneId?[{row,task}]:[];});
  const inspected=[...new Map(items.flatMap(x=>x.row.frames).map(f=>[f.frame,f])).values()];
  return {sceneId:s.sceneId,status:items.length?'reviewed':'not_reviewed',inspected,issues:items.map(({row,task})=>({category:task.category,severity:task.severity,frames:row.frames,observation:('이전 제안의 재검수 기록: '+row.notes).slice(0,1000),suggestion:task.suggestion})),notes:items.length?'재검수의 지속 항목에서 파생된 작업; 새로운 전체 장면 검수 아님':'이번 반복의 지속 항목 없음'};
 })};
 const selected=critique.scenes.flatMap((s,i)=>s.issues.map((_,j)=>'T'+(i+1)+'-'+(j+1)));
 return validateRevisionPlan({version:1,planId,baseline:current,critique,selected}).plan;
}
export function inspectLoop(raw:unknown){
 const loop=ReviewLoop.parse(raw);let plan=validateRevisionPlan(loop.initial).plan;
 if(!plan.baseline.technicalPassed)throw new Error('기술 검사 통과 후 수정 반복을 시작해 주세요.');
 const runs=new Set([plan.baseline.runId]),ids=new Set([plan.planId]);let status:LoopStatus='awaiting_revision',stalled=0;
 const history:{revision:number;runId:string;counts:ReturnType<typeof validateRecheck>['counts'];status:LoopStatus}[]=[];
 for(const round of loop.rounds){
  if(status!=='awaiting_revision')throw new Error('중단 조건 이후에는 반복할 수 없어요.');
  if(runs.has(round.current.runId)||ids.has(round.nextPlanId))throw new Error('검수 실행 또는 수정 계획이 중복됐어요.');
  runs.add(round.current.runId);ids.add(round.nextPlanId);
  const {counts,result}=validateRecheck(plan,round.current,round.result);
  const tasks=validateRevisionPlan(plan).tasks;
  stalled=counts.improved===0?stalled+1:0;
  const unchanged=counts.persists>0&&result.tasks.filter(t=>t.status==='persists').every(row=>row.frames.every(f=>tasks.find(t=>t.id===row.id)!.frames.some(old=>old.sha256===f.sha256)));
  if(!round.current.technicalPassed)status='technical_blocked';
  else if(counts.uncertain||counts.notReviewed)status='uncertain';
  else if(!counts.persists)status='manual_review';
  else if(unchanged||stalled>=2)status='no_progress';
  else if(history.length+1>=loop.maxRounds)status='round_limit';
  else plan=nextPlan(plan,round.current,result,round.nextPlanId);
  history.push({revision:round.current.revision,runId:round.current.runId,counts,status});
 }
 if(loop.rounds.length>loop.maxRounds)throw new Error('반복 횟수 한도를 초과했어요.');
 return {loop,status,history,activePlan:status==='awaiting_revision'?plan:undefined,remaining:loop.maxRounds-loop.rounds.length,approval:'manual_only' as const};
}
export function startLoop(input:unknown,sourceHash:string,maxRounds=3){
 const initial=validateRevisionPlan(input).plan;
 return inspectLoop({version:1,loopId:globalThis.crypto.randomUUID(),sourceHash,maxRounds,initial,rounds:[]});
}
export function prepareLoop(raw:unknown,current:Request,sourceHash:string){
 const state=inspectLoop(raw);
 if(state.loop.sourceHash!==sourceHash)throw new Error('보호된 원본 입력이 변경됐어요. 새 검수 작업을 시작해 주세요.');
 if(!state.activePlan)throw new Error('반복 작업이 중단됐어요: '+state.status);
 return buildRecheckRequest(state.activePlan,current);
}
export function recordLoop(raw:unknown,current:Request,result:unknown,sourceHash:string){
 const state=inspectLoop(raw);const req=prepareLoop(state.loop,current,sourceHash);
 const verified=validateRecheck(req.plan,current,result);
 return inspectLoop({...state.loop,rounds:[...state.loop.rounds,{current,result:verified.result,nextPlanId:globalThis.crypto.randomUUID()}]});
}
