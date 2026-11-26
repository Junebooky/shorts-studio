import {useRef,useState} from 'react';
import {Button} from '../../design-system/components';
import type {CriticRequest,CriticResult} from '../../core/quality/critic';
import {revisionTasks,buildRevisionPlan,validateRevisionPlan,buildRecheckRequest,validateRecheck,type RevisionPlan} from '../../core/quality/revision';
function saveJson(name:string,value:unknown){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function readJson(file:File){if(file.size>5*1024*1024)throw new Error('5MB 이하 JSON만 지원해요.');return JSON.parse(await file.text());}
export function RevisionPanel({request,critique}:{request:CriticRequest;critique?:CriticResult}){
 const [selected,setSelected]=useState<string[]>([]),[baseline,setBaseline]=useState<RevisionPlan>(),[result,setResult]=useState<ReturnType<typeof validateRecheck>>(),[error,setError]=useState('');
 const planInput=useRef<HTMLInputElement>(null),resultInput=useRef<HTMLInputElement>(null);
 const tasks=critique?revisionTasks(request,critique):[];
 const chosen=selected.filter(id=>tasks.some(t=>t.id===id));
 let recheck:ReturnType<typeof buildRecheckRequest>|undefined;
 if(baseline)try{recheck=buildRecheckRequest(baseline,request);}catch{/* import handler reports invalid baseline */}
 const labels={improved:'개선 의견',persists:'문제 지속',uncertain:'판단 보류',not_reviewed:'미검수'};
 const link=(frame:number)=>'/api/production/frame?'+new URLSearchParams({id:request.projectId,revision:String(request.revision),run:request.runId,frame:String(frame)});
 return <div className="rounded-lg bg-white p-2 shadow-xs space-y-2 text-xs"><h5 className="font-bold">시각 개선 작업과 재검수</h5><p>수정할 제안을 직접 선택해 작업 파일로 저장하세요. 제작 에이전트에 전달한 뒤 새 리비전을 저장하고 검수 영상을 다시 만들어요.</p>
 {tasks.length>0&&<><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>setSelected(tasks.filter(t=>t.severity==='major').slice(0,300).map(t=>t.id))}>중요 제안 선택</Button><Button variant="secondary" onClick={()=>setSelected([])}>선택 해제</Button></div><div className="max-h-56 overflow-auto space-y-1">{tasks.map(t=><label key={t.id} className="flex gap-2 items-start"><input type="checkbox" checked={chosen.includes(t.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,t.id]:v.filter(id=>id!==t.id))}/><span>{t.id} · {t.sceneId} · {t.suggestion}</span></label>)}</div><Button variant="secondary" disabled={!chosen.length||chosen.length>300} onClick={()=>saveJson('revision-plan-r'+request.revision+'.json',buildRevisionPlan(request,critique,chosen).plan)}>선택한 수정 작업 저장 ({chosen.length})</Button></>}
 <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>planInput.current?.click()}>이전 수정 작업 불러오기</Button>{recheck&&<><Button variant="secondary" onClick={()=>saveJson('revision-recheck-r'+request.revision+'.json',recheck)}>재검수 요청 저장</Button><Button variant="secondary" onClick={()=>resultInput.current?.click()}>재검수 결과 불러오기</Button></>}</div>
 <input ref={planInput} type="file" accept=".json,application/json" className="hidden" onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;setBaseline(undefined);setResult(undefined);setError('');try{const {plan}=validateRevisionPlan(await readJson(f));buildRecheckRequest(plan,request);setBaseline(plan);}catch(err){setError(err instanceof Error?err.message:'수정 작업을 읽을 수 없어요.');}}}/>
 <input ref={resultInput} type="file" accept=".json,application/json" className="hidden" onChange={async e=>{const f=e.target.files?.[0];e.target.value='';if(!f||!baseline)return;setResult(undefined);setError('');try{setResult(validateRecheck(baseline,request,await readJson(f)));}catch(err){setError(err instanceof Error?err.message:'재검수 결과를 읽을 수 없어요.');}}}/>
 {error&&<p role="alert" className="text-rose-700 break-words">{error}</p>}
 {recheck&&<p>리비전 {recheck.plan.baseline.revision} → {request.revision} · 선택된 수정 작업 {recheck.tasks.length}개</p>}
 {result&&<div className="space-y-1"><p>개선 의견 {result.counts.improved} · 지속 {result.counts.persists} · 보류 {result.counts.uncertain} · 미검수 {result.counts.notReviewed}</p>{result.result.tasks.map(t=><div key={t.id}><p className="font-medium">{t.id} · {labels[t.status]}</p><p className="break-words">{t.notes}</p>{t.frames.map(f=><a key={f.frame} href={link(f.frame)} target="_blank" rel="noreferrer" className="underline mr-2">{(f.frame/request.scenes.fps).toFixed(2)}초</a>)}</div>)}</div>}
 <p className="text-slate-500">가져온 작업 및 판단은 사용자 제공 기록이에요. 자동 수정이나 승인 없이, 현재 이미지 근거와 형식만 확인해요.</p></div>;
}
