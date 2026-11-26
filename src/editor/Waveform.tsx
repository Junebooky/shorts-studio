import {useEffect,useState} from 'react';
import {waveformPeaks} from '../core/timing';
type Decoded={audio:string;peaks:number[];durationMs:number};
export function Waveform({audio,durationMs,onSeek}:{audio:string|null;durationMs:number;onSeek:(ms:number)=>void}){
 const [decoded,setDecoded]=useState<Decoded|null>(null),[failure,setFailure]=useState<string|null>(null),[selection,setSelection]=useState(0);
 useEffect(()=>{
  setDecoded(null);setFailure(null);setSelection(0);if(!audio)return;
  let active=true;const controller=new AbortController();let ctx:AudioContext|undefined;
  const close=()=>{if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});};
  void (async()=>{
   try{
    if(typeof AudioContext==='undefined')throw new Error('이 브라우저는 음성 파형 분석을 지원하지 않습니다.');
    ctx=new AudioContext();const r=await fetch('/'+audio,{signal:controller.signal});if(!r.ok)throw new Error('음성 읽기 실패');
    const data=await r.arrayBuffer();if(!active)return;
    const buf=await ctx.decodeAudioData(data);if(!active)return;
    const channels=Array.from({length:buf.numberOfChannels},(_,i)=>buf.getChannelData(i));
    setDecoded({audio,peaks:waveformPeaks(channels),durationMs:Math.round(buf.duration*1000)});
   }catch(e){if(active)setFailure(e instanceof Error?e.message:'음성 파형 분석 실패');}
   finally{close();}
  })();
  return()=>{active=false;controller.abort();close();};
 },[audio]);
 const current=decoded?.audio===audio?decoded:null;
 const state=!audio?'음성을 추가하면 실제 파형이 표시됩니다.':current?'실제 음성 파형':failure||'음성 파형 분석 중';
 const mismatch=!!current&&Math.abs(current.durationMs-durationMs)>100;
 const seek=(ms:number)=>{const next=Math.max(0,Math.min(durationMs,Math.round(ms)));setSelection(next);onSeek(next);};
 const selected=Math.min(durationMs,selection);
 return <div className="space-y-2"><div className="text-xs text-slate-500" role="status">{state}</div>
 {mismatch&&<p className="text-xs text-amber-800">음성 파일 길이 {(current!.durationMs/1000).toFixed(2)}초와 프로젝트 {(durationMs/1000).toFixed(2)}초가 다릅니다. 타이밍을 재검토하세요.</p>}
 {current&&current.peaks.length>0&&<><button type="button" className="w-full bg-slate-50 rounded-lg shadow-inner overflow-hidden cursor-crosshair focus-visible:ring-2 focus-visible:ring-cobalt/40" aria-label="음성 파형에서 재생 위치 선택" onClick={ev=>{if(ev.detail===0){seek(selected);return;}const r=ev.currentTarget.getBoundingClientRect();if(r.width>0)seek((ev.clientX-r.left)/r.width*current.durationMs);}}>
  <svg viewBox={`0 0 ${current.peaks.length} 44`} className="w-full h-11" preserveAspectRatio="none" aria-hidden="true">{current.peaks.map((x,i)=><line key={i} x1={i+.5} x2={i+.5} y1={22-Math.max(.5,x*21)} y2={22+Math.max(.5,x*21)} stroke="#1E60F3" strokeWidth=".8"/>)}<line x1={Math.min(current.peaks.length,selected/current.durationMs*current.peaks.length)} x2={Math.min(current.peaks.length,selected/current.durationMs*current.peaks.length)} y1="0" y2="44" stroke="#334155" strokeWidth="1"/></svg>
 </button><label className="block text-xs text-slate-600">탐색 위치 · {(selected/1000).toFixed(2)}초<input aria-label="음성 탐색 위치" className="block w-full accent-cobalt" type="range" min={0} max={Math.min(durationMs,current.durationMs)} step={1} value={Math.min(selected,current.durationMs)} onChange={e=>seek(Number(e.target.value))}/></label></>}
 </div>;
}
