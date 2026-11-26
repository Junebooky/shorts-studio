import {useEffect,useRef,useState} from 'react';
import {Button,inputClass} from '../design-system/components';
import {VoiceOptions} from '../core/elevenlabs';
import {isCurrent} from '../core/timing';
import type {Project} from '../core/project';

type Voice={id:string;name:string;korean:boolean};
type Status='loading'|'ready'|'missing'|'error';
type Operation='voices'|'generate'|'align';
async function api<T>(route:string,body?:unknown,signal?:AbortSignal):Promise<T>{
 const r=await fetch('/api/elevenlabs/'+route,{...(body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),signal});
 let j;try{j=await r.json();}catch{throw new Error('음성 서비스의 응답을 읽지 못했어요. 서비스 상태를 확인해 주세요.');}
 if(!r.ok)throw new Error(typeof j?.error==='string'?j.error:'음성 요청을 처리하지 못했어요.');
 return j as T;
}
export function VoicePanel({project:p,busy,dirty,onRun,onResult}:{project:Project;busy:boolean;dirty:boolean;onRun:(fn:()=>Promise<void>)=>void;onResult:(p:Project,n:string)=>Promise<void>}){
 const [status,setStatus]=useState<Status>('loading'),[refresh,setRefresh]=useState(0),[voice,setVoice]=useState(''),[voices,setVoices]=useState<Voice[]>([]),[model,setModel]=useState('eleven_multilingual_v2'),[speed,setSpeed]=useState(1),[more,setMore]=useState(false),[operation,setOperation]=useState<Operation|null>(null),[message,setMessage]=useState('');
 const locked=useRef(false);
 useEffect(()=>{
  const controller=new AbortController();setStatus('loading');
  api<{configured:boolean;defaultVoice:string}>('status',undefined,controller.signal).then(s=>{
   if(controller.signal.aborted)return;
   if(typeof s.configured!=='boolean'||typeof s.defaultVoice!=='string')throw new Error('음성 서비스 상태를 확인할 수 없어요.');
   setStatus(s.configured?'ready':'missing');setVoice(v=>v||s.defaultVoice);
  }).catch(()=>{if(!controller.signal.aborted)setStatus('error');});
  return()=>controller.abort();
 },[refresh]);
 const working=busy||operation!==null;
 const reason=status!=='ready'?'음성 서비스 설정을 확인해 주세요.':p.id==='demo'?'데모를 복제한 뒤 사용할 수 있어요.':dirty?'프로젝트를 먼저 저장해 주세요.':!p.script.trim()?'원본 대본을 입력해 주세요.':p.script.length>3000?'한 번에 최대 3,000자까지 음성으로 만들거나 정렬할 수 있어요.':'';
 const options=VoiceOptions.safeParse({voiceId:voice,model,speed});
 const current=isCurrent(p.analysis,p)&&p.timingSource===p.analysis?.source;
 const timing=!p.audio?'아직 추가한 음성이 없어요.':!current?'발화 시간이 확인되지 않았어요. 음성에 자막을 맞춰 주세요.':p.analysis?.status==='review'?'대본과 일치하지 않거나 확인할 부분이 있어요.':'대본과 발화 시간 정보를 맞췄어요. 직접 들어보고 확인해 주세요.';
 const run=(kind:Operation,fn:()=>Promise<void>)=>{
  if(locked.current||working)return;
  locked.current=true;setOperation(kind);setMessage('');
  onRun(async()=>{try{await fn();}catch(e){setMessage(e instanceof Error?e.message:'음성 요청을 처리하지 못했어요.');throw e;}finally{locked.current=false;setOperation(null);}});
 };
 const statusText={loading:'음성 서비스 설정을 확인하고 있어요.',ready:'API 키가 설정됐어요. 실제 연결은 요청할 때 확인해요.',missing:'.env.local에 ElevenLabs API 키를 입력하고 스튜디오 서버를 다시 실행해 주세요.',error:'음성 서비스 상태를 확인하지 못했어요.'}[status];
 return <section className="rounded-2xl bg-slate-50 p-3 space-y-3" aria-busy={working}>
  <h3 className="font-black text-sm">AI 성우 · ElevenLabs</h3>
  <div className="flex items-center justify-between gap-2"><p className="text-xs text-slate-500" role="status">{statusText}</p>{(status==='error'||status==='missing')&&<Button type="button" variant="ghost" disabled={working} onClick={()=>setRefresh(n=>n+1)}>다시 확인</Button>}</div>
  <div className="rounded-xl bg-white shadow-xs p-3 text-xs space-y-1"><div className="font-bold">{timing}</div><p className="text-slate-500">대본 {p.script.length.toLocaleString('ko-KR')} / 3,000자{p.audio?' · '+(p.durationMs/1000).toFixed(2)+'초':''}</p>{p.audio&&<audio key={p.audio} controls preload="metadata" className="w-full" src={'/'+p.audio} onError={()=>setMessage('음성을 재생하지 못했어요. 파일을 확인해 주세요.')}/>}</div>
  <Button type="button" variant="secondary" className="w-full" disabled={status!=='ready'||working} onClick={()=>run('voices',async()=>{const q=await api<{voices:Voice[];hasMore:boolean}>('voices');setVoices([...q.voices].sort((a,b)=>Number(b.korean)-Number(a.korean)));setMore(q.hasMore);setMessage(q.voices.length?'목소리 목록을 불러왔어요.':'등록된 목소리가 없어요. 목소리 ID를 직접 입력해 주세요.');})}>{operation==='voices'?'목소리 목록을 불러오고 있어요':'내 목소리 불러오기'}</Button>
  {voices.length>0&&<select aria-label="목소리 선택" className={inputClass} disabled={working} value={voices.some(v=>v.id===voice)?voice:''} onChange={e=>setVoice(e.target.value)}><option value="">목소리 선택 또는 ID 직접 입력</option>{voices.map(v=><option key={v.id} value={v.id}>{v.name}{v.korean?' · 한국어':''}</option>)}</select>}
  {more&&<p className="text-xs text-slate-500">목소리는 최대 100개까지 보여요. 다른 목소리는 ID를 직접 입력해 주세요.</p>}
  <label className="block text-xs font-bold">목소리 ID<input className={inputClass+' mt-1'} disabled={working} value={voice} onChange={e=>setVoice(e.target.value.trim())} placeholder="한국어 목소리 ID" aria-invalid={!!voice&&!options.success}/></label>
  <label className="block text-xs font-bold">음성 모델<select className={inputClass+' mt-1'} disabled={working} value={model} onChange={e=>setModel(e.target.value)}><option value="eleven_multilingual_v2">Multilingual v2 · 기본</option><option value="eleven_v3">Eleven v3 · 실험</option><option value="eleven_v4">Eleven v4 · 실험</option></select></label>
  <label className="block text-xs font-bold">말하기 속도 {speed.toFixed(2)}<input className="w-full accent-cobalt" disabled={working} type="range" min=".7" max="1.2" step=".05" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/></label>
  <Button type="button" className="w-full" disabled={!!reason||working||!options.success} onClick={()=>{if(locked.current||working||reason||!options.success)return;if(!window.confirm('새로운 음성을 만들까요? 대본을 ElevenLabs에 보내 음성을 만들어요. 크레딧이 사용될 수 있고 기존 장면과 자막은 초기화돼요.'))return;run('generate',async()=>{const q=await api<{project:Project;needsAlignment:boolean}>('generate?id='+encodeURIComponent(p.id),{revision:p.revision,...options.data});const note=q.needsAlignment?'음성을 만들었어요. 발화 시간 정보는 확인되지 않아 자막을 다시 맞춰야 해요.':'음성과 발화 시간 정보를 만들었어요. 음성을 직접 들어보고 연출을 시작해 주세요.';await onResult(q.project,note);setMessage(note);});}}>{operation==='generate'?'음성을 만들고 있어요':'AI 음성 만들기'}</Button>
  <Button type="button" variant="secondary" className="w-full" disabled={!!reason||working||!p.audio} onClick={()=>{if(locked.current||working||reason||!p.audio)return;if(!window.confirm('음성에 자막을 맞출까요? 현재 음성과 대본을 ElevenLabs에 보내요. 크레딧이 사용될 수 있고 기존 장면은 초기화돼요.'))return;run('align',async()=>{const q=await api<Project>('align?id='+encodeURIComponent(p.id),{revision:p.revision});const note='음성에 자막을 맞췄어요. 실제 발화와 잘 맞는지 직접 확인해 주세요.';await onResult(q,note);setMessage(note);});}}>{operation==='align'?'음성에 자막을 맞추고 있어요':'음성에 자막 맞추기'}</Button>
  {reason&&<p className="text-xs text-slate-500">{reason}</p>}
  {voice&&!options.success&&<p className="text-xs text-amber-800">목소리 ID는 영문, 숫자, 밑줄, 하이픈으로 1~80자 입력해 주세요.</p>}
  {message&&<p className="text-xs text-slate-700 break-words" role="status">{message}</p>}
 </section>;
}
