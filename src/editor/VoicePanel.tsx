import {useEffect,useRef,useState} from 'react';
import {Button,inputClass} from '../design-system/components';
import {VoiceOptions} from '../core/elevenlabs';
import {isCurrent} from '../core/timing';
import type {Project} from '../core/project';

import {VoicePersonaPicker,type VoicePersona as Voice} from '../design-system/VoicePersonaPicker';
type Status='loading'|'ready'|'missing'|'error';
type Operation='voices'|'generate'|'align';
async function api<T>(route:string,body?:unknown,signal?:AbortSignal):Promise<T>{
 const r=await fetch('/api/elevenlabs/'+route,{...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),signal});
 let j;try{j=await r.json();}catch{throw new Error('음성 서버 응답을 읽지 못했습니다. 서버 상태를 확인하세요.');}
 if(!r.ok)throw new Error(typeof j?.error==='string'?j.error:'음성 요청 실패');
 return j as T;
}
export function VoicePanel({project:p,busy,dirty,onRun,onResult}:{project:Project;busy:boolean;dirty:boolean;onRun:(fn:()=>Promise<void>)=>void;onResult:(p:Project,n:string)=>Promise<void>}){
 const [status,setStatus]=useState<Status>('loading'),[refresh,setRefresh]=useState(0),[voice,setVoice]=useState(''),[voices,setVoices]=useState<Voice[]>([]),[model,setModel]=useState('eleven_multilingual_v2'),[speed,setSpeed]=useState(1),[more,setMore]=useState(false),[operation,setOperation]=useState<Operation|null>(null),[message,setMessage]=useState('');
 const locked=useRef(false);
 useEffect(()=>{
  const controller=new AbortController();setStatus('loading');
  api<{configured:boolean;defaultVoice:string}>('status',undefined,controller.signal).then(s=>{
   if(controller.signal.aborted)return;
   if(typeof s.configured!=='boolean'||typeof s.defaultVoice!=='string')throw new Error('잘못된 상태 응답');
   setStatus(s.configured?'ready':'missing');setVoice(v=>v||s.defaultVoice);
  }).catch(()=>{if(!controller.signal.aborted)setStatus('error');});
  return()=>controller.abort();
 },[refresh]);
 const working=busy||operation!==null;
 const reason=status!=='ready'?'음성 서버 설정 확인 필요':p.id==='demo'?'데모를 복제한 후 사용할 수 있습니다.':dirty?'먼저 프로젝트를 저장하세요.':!p.script.trim()?'원본 대본을 입력하세요.':p.script.length>3000?'음성 요청은 최대 3,000자입니다.':'';
 const options=VoiceOptions.safeParse({voiceId:voice,model,speed});
 const current=isCurrent(p.analysis,p)&&p.timingSource===p.analysis?.source;
 const timing=!p.audio?'원본 음성 없음':!current?'타이밍 미검증 · 정렬 필요':p.analysis?.status==='review'?'원문 불일치 · 검수 필요':'텍스트 정렬됨 · 실제 청취 검수 필요';
 const run=(kind:Operation,fn:()=>Promise<void>)=>{
  if(locked.current||working)return;
  locked.current=true;setOperation(kind);setMessage('');
  onRun(async()=>{try{await fn();}catch(e){setMessage(e instanceof Error?e.message:'음성 요청 실패');throw e;}finally{locked.current=false;setOperation(null);}});
 };
 const statusText={loading:'로컬 설정 확인 중',ready:'로컬 키 설정됨 · 실제 API 연결은 요청 시 확인',missing:'로컬 .env.local에 API 키 설정 후 서버 재시작',error:'음성 서버 상태 확인 실패'}[status];
 return <section className="rounded-2xl bg-slate-50 p-3 space-y-3" aria-busy={working}>
  <h3 className="font-black text-sm">AI 성우 · ElevenLabs</h3>
  <div className="flex items-center justify-between gap-2"><p className="text-xs text-slate-500" role="status">{statusText}</p>{(status==='error'||status==='missing')&&<Button type="button" variant="ghost" disabled={working} onClick={()=>setRefresh(n=>n+1)}>다시 확인</Button>}</div>
  <div className="rounded-xl bg-white shadow-xs p-3 text-xs space-y-1"><div className="font-bold">{timing}</div><p className="text-slate-500">대본 {p.script.length.toLocaleString('ko-KR')} / 3,000자{p.audio?' · '+(p.durationMs/1000).toFixed(2)+'초':''}</p>{p.audio&&<audio key={p.audio} controls preload="metadata" className="w-full" src={'/'+p.audio} onError={()=>setMessage('원본 음성을 재생하지 못했습니다. 파일을 확인하세요.')}/>}</div>
  <Button type="button" variant="secondary" className="w-full" disabled={status!=='ready'||working} onClick={()=>run('voices',async()=>{const q=await api<{voices:Voice[];hasMore:boolean}>('voices');setVoices([...q.voices].sort((a,b)=>Number(b.korean)-Number(a.korean)));setMore(q.hasMore);setMessage(q.voices.length?'음성 목록을 불러왔습니다.':'등록된 음성이 없습니다. Voice ID를 직접 입력하세요.');})}>{operation==='voices'?'음성 목록 확인 중…':'내 음성 목록 불러오기'}</Button>
  {voices.length>0&&<VoicePersonaPicker voices={voices} value={voice} disabled={working} onChange={setVoice}/>}
  {more&&<p className="text-xs text-slate-500">최대 100개 표시. 다른 음성은 ID 직접 입력.</p>}
  <details className="text-xs"><summary className="cursor-pointer text-slate-500">Voice ID 직접 입력</summary><label className="block text-xs font-bold">Voice ID<input className={inputClass+' mt-1'} disabled={working} value={voice} onChange={e=>setVoice(e.target.value.trim())} placeholder="한국어 성우 ID" aria-invalid={!!voice&&!options.success}/></label></details>
  <label className="block text-xs font-bold">모델<select className={inputClass+' mt-1'} disabled={working} value={model} onChange={e=>setModel(e.target.value)}><option value="eleven_multilingual_v2">Multilingual v2 · 기본</option><option value="eleven_v3">Eleven v3 · 실험</option><option value="eleven_v4">Eleven v4 · 실험</option></select></label>
  <label className="block text-xs font-bold">속도 {speed.toFixed(2)}<input className="w-full accent-cobalt" disabled={working} type="range" min=".7" max="1.2" step=".05" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/></label>
  <Button type="button" className="w-full" disabled={!!reason||working||!options.success} onClick={()=>{if(locked.current||working||reason||!options.success)return;if(!window.confirm('대본을 ElevenLabs에 전송하여 음성을 생성합니다. 크레딧이 사용될 수 있으며 기존 장면/자막은 새 타이밍에 맞춰 초기화됩니다. 계속할까요?'))return;run('generate',async()=>{const q=await api<{project:Project;needsAlignment:boolean}>('generate?id='+encodeURIComponent(p.id),{revision:p.revision,...options.data});const note=q.needsAlignment?'음성 생성 완료 · 강제 정렬 필요':'음성 및 문자 타이밍 생성 완료 · 음성을 들어본 후 연출을 시작하세요.';await onResult(q.project,note);setMessage(note);});}}>{operation==='generate'?'음성 생성 중…':'AI 음성 생성 + 타이밍'}</Button>
  <Button type="button" variant="secondary" className="w-full" disabled={!!reason||working||!p.audio} onClick={()=>{if(locked.current||working||reason||!p.audio)return;if(!window.confirm('현재 음성과 대본을 ElevenLabs에 전송합니다. 크레딧이 사용될 수 있고 기존 장면은 초기화됩니다. 계속할까요?'))return;run('align',async()=>{const q=await api<Project>('align?id='+encodeURIComponent(p.id),{revision:p.revision});const note='강제 정렬 완료 · 실제 발화와 비교 검수 필요';await onResult(q,note);setMessage(note);});}}>{operation==='align'?'강제 정렬 중…':'현재 음성 강제 정렬'}</Button>
  {reason&&<p className="text-xs text-slate-500">{reason}</p>}
  {voice&&!options.success&&<p className="text-xs text-amber-800">Voice ID는 영문, 숫자, 밑줄, 하이픈으로 1~80자 입력하세요.</p>}
  {message&&<p className="text-xs text-slate-700 break-words" role="status">{message}</p>}
 </section>;
}
