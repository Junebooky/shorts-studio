import {useState} from 'react';
import {Button} from '../design-system/components';
import {timingIssueLabel} from '../copy/editor-guidance';
import type {MasterTimeline} from '../core/timing';
const sources:Record<MasterTimeline['source'],string>={srt:'SRT 가져오기',whisper:'Whisper 음성 인식','elevenlabs-tts':'AI 음성의 발화 시간','elevenlabs-align':'ElevenLabs 발화 시간 확인'};
const time=(ms:number)=>(ms/1000).toFixed(2)+'초';
const span=(x:{startMs:number;endMs:number})=>time(x.startMs)+' – '+time(x.endMs);
const pageSize=20;
export function TimingPanel({analysis,onSeek}:{analysis?:MasterTimeline;onSeek:(ms:number)=>void}){
 if(!analysis)return <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">음성과 발화 시간 정보를 추가하면 분석 결과를 볼 수 있어요.</div>;
 return <TimingEvidence key={JSON.stringify([analysis.sourceAudio,analysis.sourceScript,analysis.durationMs,analysis.source])} a={analysis} onSeek={onSeek}/>;
}
function TimingEvidence({a,onSeek}:{a:MasterTimeline;onSeek:(ms:number)=>void}){
 const [page,setPage]=useState(0),[pausePage,setPausePage]=useState(0);
 const last=Math.max(0,Math.ceil(a.segments.length/pageSize)-1),p=Math.min(page,last);
 const lastPause=Math.max(0,Math.ceil(a.pauses.length/pageSize)-1),pp=Math.min(pausePage,lastPause);
 const seek=(ms:number)=>onSeek(Math.max(0,Math.min(a.durationMs,ms)));
 return <section className="rounded-2xl bg-slate-50 p-3 space-y-3">
  <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-black">음성과 자막</h3><span className={'text-xs font-bold '+(a.status==='matched'?'text-emerald-700':'text-amber-700')}>{a.status==='matched'?'대본과 일치해요':'확인이 필요해요'}</span></div>
  <p className="text-xs text-slate-500">{sources[a.source]} · {time(a.durationMs)}</p>
  <div className="grid grid-cols-3 gap-2 text-center">{[['대본 일치율',Math.round(a.coverage*100)+'%'],['발화 구간',a.segments.length],['단어 수',a.words.length]].map(([label,value])=><div key={label} className="bg-white rounded-xl shadow-xs p-2"><div className="font-black text-cobalt tabular-nums">{value}</div><div className="text-xs text-slate-500">{label}</div></div>)}</div>
  <p className="text-xs text-slate-500">대본과 발화 시간 정보에 기록된 내용을 비교한 결과예요. 실제 음성과 자막이 잘 맞는지 재생해서 확인해 주세요.</p>
  {!a.words.length&&<p className="text-xs text-amber-800">단어별 발화 시간 정보가 없어 구간별로만 확인할 수 있어요. 단어의 시간을 임의로 추정하지 않아요.</p>}
  {a.issues.length>0&&<details className="text-xs text-amber-800"><summary className="cursor-pointer font-bold">확인이 필요한 항목 {a.issues.length}건</summary><div className="max-h-48 overflow-y-auto">{a.issues.map((x,i)=><p key={i} className="mt-1 break-words">{timingIssueLabel(x)}</p>)}</div></details>}
  <div className="space-y-2"><h4 className="text-xs font-bold">발화 구간 · 눌러서 확인하기</h4>
   {a.segments.slice(p*pageSize,(p+1)*pageSize).map((s,i)=><details key={p*pageSize+i} className="bg-white rounded-xl shadow-xs p-2 text-xs space-y-2"><summary className="cursor-pointer font-bold break-words">{p*pageSize+i+1}. {s.text}<span className="block font-normal text-slate-500 tabular-nums">{span(s)} · 단어 {s.words.length}개</span></summary>
    <Button type="button" variant="secondary" className="w-full" onClick={()=>seek(s.startMs)}>이 구간부터 확인하기</Button>
    {s.words.length>0&&<div className="max-h-48 overflow-y-auto space-y-1">{s.words.map((w,j)=><button type="button" key={j} onClick={()=>seek(w.startMs)} className="w-full text-left rounded-lg p-2 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-cobalt/40"><span className="font-bold break-words">{w.text}</span><span className="block tabular-nums text-slate-500">{span(w)}{w.confidence!==undefined?' · 인식 신뢰도 '+Math.round(w.confidence*100)+'%':''}</span>{w.confidence!==undefined&&w.confidence<.5&&<span className="text-amber-800">음성 인식이 불확실해요</span>}</button>)}</div>}
   </details>)}
   {last>0&&<div className="flex items-center justify-between"><Button type="button" variant="ghost" disabled={p===0} onClick={()=>setPage(p-1)}>이전</Button><span className="text-xs tabular-nums">{p+1} / {last+1}</span><Button type="button" variant="ghost" disabled={p===last} onClick={()=>setPage(p+1)}>다음</Button></div>}
  </div>
  {a.pauses.length>0&&<details className="text-xs text-slate-600"><summary className="cursor-pointer font-bold">발화 시간 기록이 없는 구간 {a.pauses.length}개</summary>{a.pauses.slice(pp*pageSize,(pp+1)*pageSize).map((x,i)=><button type="button" key={pp*pageSize+i} onClick={()=>seek(x.startMs)} className="block w-full text-left py-1 hover:text-cobalt">{span(x)}</button>)}{lastPause>0&&<div className="flex items-center justify-between"><Button type="button" variant="ghost" disabled={pp===0} onClick={()=>setPausePage(pp-1)}>이전</Button><span>{pp+1} / {lastPause+1}</span><Button type="button" variant="ghost" disabled={pp===lastPause} onClick={()=>setPausePage(pp+1)}>다음</Button></div>}</details>}
 </section>;
}
