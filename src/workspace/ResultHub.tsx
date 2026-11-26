import {useEffect,useState} from 'react';
import {z} from 'zod';
import {Button,Card,inputClass} from '../design-system/components';
import {FinalArtifact} from '../core/production-library';
import {formatLabels,type ContentFormat} from './content-plan';
import {summarizeResults,resultQueue,canSkipNext} from './content-results';
import {renderCard} from './card-renderer';
import {cardSizes} from './card-news';
import {threadReady,threadText} from './thread-news';
import type {SharedContent} from './shared-content';
import type {useCardNews} from './useCardNews';
import type {useThreads} from './useThreads';
const librarySchema=z.object({revision:z.number().int().nonnegative(),finals:z.array(FinalArtifact.extend({available:z.boolean()}))});
const statusSchema=z.object({revision:z.number().int(),reviewApproved:z.boolean(),finalReady:z.boolean()});
const jobSchema=z.object({status:z.string(),stage:z.string().optional(),projectId:z.string().optional()});
type Evidence={revision:number;reviewApproved:boolean;finalReady:boolean;finals:z.infer<typeof librarySchema>['finals'];draftAvailable:boolean};
async function getJson(url:string,signal:AbortSignal){const r=await fetch(url,{signal,cache:'no-store'});if(!r.ok)throw Error('결과를 확인하지 못했어요.');return r.json();}
function saveFile(url:string,name:string){const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();}
function VideoEvidence({source,onOpen}:{source:Extract<NonNullable<SharedContent['source']>,{kind:'video'}>;onOpen:()=>void}){
 const [attempt,setAttempt]=useState(0),[evidence,setEvidence]=useState<Evidence|null>(null),[error,setError]=useState('');
 useEffect(()=>{const ctl=new AbortController(),id=encodeURIComponent(source.projectId);setEvidence(null);setError('');
 (async()=>{try{const [library,status]=await Promise.all([getJson('/api/production/library?id='+id,ctl.signal),getJson('/api/production/status?id='+id,ctl.signal)]);const l=librarySchema.parse(library),s=statusSchema.parse(status);if(l.revision!==s.revision)throw Error('영상 버전이 변경됐어요. 다시 확인해 주세요.');
 let draftAvailable=false;if(source.draftJobKey){try{const j=jobSchema.parse(await getJson('/api/job?id='+encodeURIComponent(source.draftJobKey),ctl.signal));draftAvailable=j.status==='done'&&j.stage==='done'&&j.projectId===source.projectId;}catch{}}
 if(!ctl.signal.aborted)setEvidence({revision:l.revision,reviewApproved:s.reviewApproved,finalReady:s.finalReady,finals:l.finals.filter(f=>f.projectId===source.projectId&&f.revision===source.revision&&f.available),draftAvailable});
 }catch(e){if(!ctl.signal.aborted)setError(e instanceof Error?e.message:'영상 상태를 확인하지 못했어요.');}})();
 return ()=>ctl.abort();},[source.projectId,source.revision,source.draftJobKey,attempt]);
 const final=evidence?.finals[0];
 return <div className="space-y-3">
 {error?<p role="alert" className="text-sm text-rose-700">{error} 서버에 연결한 뒤 다시 확인해 주세요.</p>:!evidence?<p role="status" className="text-sm text-slate-500">실제 영상 저장 상태를 확인하고 있어요.</p>:<div className="space-y-2"><p className="text-sm font-semibold" data-testid="video-result-status">{final?'원본 버전 최종 MP4 보관됨':evidence.draftAvailable?'초안 MP4 생성 · 최종 검수 필요':'원본 저장됨 · 다운로드 가능한 초안은 확인되지 않음'}</p>{evidence.revision!==source.revision?<p className="text-xs text-amber-800">현재 영상은 리비전 {evidence.revision}이에요. 이 화면은 원본 리비전 {source.revision}의 결과만 보여줘요.</p>:<p className="text-xs text-slate-600">{evidence.reviewApproved?'영상 검수 기록 있음':'영상 검수 기록 없음'} · {evidence.finalReady?'최종 출력 가능 상태':'최종 출력 준비 필요'}</p>}
 {final&&<a className="ds-button ds-button-primary inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-bold" href={'/api/production/library/download?id='+encodeURIComponent(source.projectId)+'&artifact='+encodeURIComponent(final.id)}>보관된 최종 MP4 다운로드</a>}
 {evidence.draftAvailable&&source.draftJobKey&&<a className="ds-button ds-button-secondary inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-bold" href={'/api/download?id='+encodeURIComponent(source.draftJobKey)}>원본 초안 MP4 다운로드</a>}</div>}
 <div className="flex flex-wrap gap-3"><Button onClick={onOpen}>영상 확인 및 검수</Button><Button variant="secondary" onClick={()=>setAttempt(n=>n+1)}>영상 상태 다시 확인</Button></div>
 </div>;
}
function CardExport({deck}:{deck:ReturnType<typeof useCardNews>['draft']}){
 const [index,setIndex]=useState(0),[busy,setBusy]=useState(false),[note,setNote]=useState('');
 const p=deck.pages[Math.min(index,deck.pages.length-1)];
 const download=async()=>{setBusy(true);setNote('');try{if(!p.title.trim())throw Error('페이지 제목을 입력해 주세요.');const canvas=document.createElement('canvas'),r=await renderCard(canvas,deck,p,index);if(r.overflow)throw Error('페이지 글자나 그래픽이 영역을 넘었어요. 카드뉴스에서 수정해 주세요.');saveFile(canvas.toDataURL('image/png'),deck.name+'-'+String(index+1).padStart(2,'0')+'.png');setNote('선택한 페이지 PNG 다운로드를 시작했어요.');}catch(e){setNote(e instanceof Error?e.message:'PNG를 만들지 못했어요.');}finally{setBusy(false);}};
 return <div className="space-y-3"><label className="block text-sm font-medium">다운로드할 페이지<select aria-label="다운로드할 카드 페이지" className={inputClass+' mt-2'} value={index} disabled={busy} onChange={e=>{setIndex(Number(e.target.value));setNote('');}}>{deck.pages.map((v,i)=><option key={v.id} value={i}>{i+1}. {v.title||'제목 없음'}</option>)}</select></label><Button variant="secondary" disabled={busy||!p.title.trim()} onClick={()=>void download()}>{busy?'PNG 준비 중':'선택 페이지 PNG 다운로드'}</Button>{note&&<p role="status" className="text-sm text-slate-600">{note}</p>}</div>;
}
export function ResultHub({record,cards,threads,onOpen,onSkip,onHome}:{record:SharedContent;cards:ReturnType<typeof useCardNews>;threads:ReturnType<typeof useThreads>;onOpen:(f:ContentFormat)=>void;onSkip:()=>void;onHome:()=>void}){
 const items=summarizeResults(record,cards,threads),queue=resultQueue(record,items);
 const [note,setNote]=useState('');
 const exportThread=()=>{if(!threadReady(threads.draft))return;const url=URL.createObjectURL(new Blob([threadText(threads.draft)],{type:'text/plain;charset=utf-8'}));saveFile(url,threads.draft.name+'.txt');setTimeout(()=>URL.revokeObjectURL(url),1000);setNote('스레드 TXT 다운로드를 시작했어요.');};
 const labels={'not-started':'아직 제작 전',editing:'편집 중 · 저장 필요',saved:'저장된 초안',source:'영상 원본 연결됨',unavailable:'저장 상태 확인 필요'};
 return <main className="marketing-module result-hub"><div className="marketing-home-heading"><div><p className="text-sm font-medium text-cobalt">통합 콘텐츠 제작</p><h1 className="text-3xl font-bold tracking-tight mt-2">제작 결과</h1><p className="text-sm text-slate-600 mt-3 break-words">{record.plan.topic}</p></div><Button variant="secondary" onClick={onHome}>제작 계획으로 돌아가기</Button></div>
 <Card className="space-y-3"><h2 className="text-lg font-semibold">{queue.pending?'다음 콘텐츠를 이어서 준비하세요.':'선택한 콘텐츠 작업을 마쳤어요.'}</h2><p className="text-sm text-slate-600">원본 연결, 초안 저장, 기본 입력 검사를 기준으로 보여줘요. 최종 검수나 발행 완료를 의미하지 않아요.</p>{queue.pending&&<div className="flex flex-wrap gap-3"><Button onClick={()=>onOpen(queue.pending!)}>{formatLabels[queue.pending]} 이어서 작업하기</Button>{canSkipNext(record,items)&&<Button variant="ghost" onClick={onSkip}>이번에는 건너뛰기</Button>}</div>}{queue.skipped.length>0&&<p className="text-xs text-slate-500">건너뛴 작업 · {queue.skipped.map(f=>formatLabels[f]).join(', ')}</p>}</Card>
 {items.filter(i=>queue.selected.includes(i.format)&&i.ready&&!queue.skipped.includes(i.format)).map(i=><Card key={i.format} className="space-y-4" ><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{formatLabels[i.format]}</h2><span className="text-xs font-medium text-slate-600">{labels[i.state]}</span></div><p className="text-sm text-slate-600">{i.detail}</p>
 {i.format==='video'&&record.source?.kind==='video'?<VideoEvidence key={record.source.projectId+':'+record.source.revision} source={record.source} onOpen={()=>onOpen('video')}/>:<>
 <Button onClick={()=>onOpen(i.format)}>{i.linked?formatLabels[i.format]+' 확인 및 편집':formatLabels[i.format]+' 작업 시작'}</Button>
 {i.format==='card'&&i.linked&&i.state==='saved'&&<><p className="text-xs text-slate-500">{cardSizes[cards.draft.size].width} × {cardSizes[cards.draft.size].height} · 각 페이지를 출력할 때 영역 초과를 검사해요.</p><CardExport key={JSON.stringify(cards.draft)} deck={cards.draft}/></>}
 {i.format==='thread'&&i.ready&&<><Button variant="secondary" onClick={exportThread}>스레드 TXT 다운로드</Button>{note&&<p role="status" className="text-xs text-slate-600">{note}</p>}</>}
 </>}
 </Card>)}

 </main>;
}
