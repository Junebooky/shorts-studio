import {useState} from 'react';
import {Thumbnail} from '@remotion/player';
import {Button,Card,inputClass} from '../design-system/components';
import {FPS} from '../core/project';
import {MasterCard} from './MasterCard';
import {masterCardProps,masterSizes,threadDraft,type MasterContent,type MasterSize} from './master-content';
export function MasterRepurposePanel({source,format,onRefresh}:{source:MasterContent;format:'card'|'thread';onRefresh:()=>Promise<void>}){
 const [index,setIndex]=useState(0),[size,setSize]=useState<MasterSize>(format==='card'?'portrait':'square'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const entry=source.scenes[index],props=masterCardProps(source,entry.scene.id,size),dims=masterSizes[size];
 const post=threadDraft(source)[index];
 const exportImage=async()=>{if(busy)return;setBusy(true);setError('');try{
  const r=await fetch('/api/master/card?id='+encodeURIComponent(source.projectId),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:source.revision,sceneId:entry.scene.id,size})});
  if(!r.ok){const j=await r.json();throw Error(j.error||'이미지를 만들지 못했어요.');}
  if(!r.headers.get('Content-Type')?.startsWith('image/png'))throw Error('PNG 응답을 확인하지 못했어요.');
  const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download='scene-'+String(index+1).padStart(2,'0')+'-'+size+'.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
 }catch(e){setError(e instanceof Error?e.message:'이미지를 만들지 못했어요.');}finally{setBusy(false);}};
 return <main className="marketing-module space-y-6">
  <div><p className="text-sm text-cobalt font-semibold">원본 영상에서 만들기</p><h1 className="text-3xl font-bold mt-2">{format==='card'?'카드뉴스 초안':'스레드 초안'}</h1><p className="text-sm text-slate-600 mt-3">{source.title} · 원본 버전 {source.revision} · {source.scenes.length}개 장면</p></div>
  <Card className="space-y-4 !p-6"><div className="flex justify-end"><Button variant="secondary" disabled={busy} onClick={onRefresh}>최신 저장 원본 가져오기</Button></div><p className="text-sm text-slate-600">같은 장면 그래픽과 실제 배치 소재를 사용해요. 이미지 비율을 바꿔도 원본 영상은 수정하지 않아요. 아직 검수 전 초안이에요.</p><div className="flex gap-3 flex-wrap"><Button variant={size==='portrait'?'primary':'secondary'} aria-pressed={size==='portrait'} onClick={()=>setSize('portrait')} disabled={busy}>세로 4:5</Button><Button variant={size==='square'?'primary':'secondary'} aria-pressed={size==='square'} onClick={()=>setSize('square')} disabled={busy}>정사각형 1:1</Button></div></Card>
  <div className="grid gap-6 lg:grid-cols-[minmax(200px,1fr)_minmax(0,2fr)] items-start">
   <Card className="space-y-3 !p-5"><h2 className="font-semibold">원본 장면</h2><div className="max-h-[70vh] overflow-y-auto space-y-2">{source.scenes.map((item,i)=><button type="button" key={item.scene.id} disabled={busy} aria-current={i===index?'step':undefined} onClick={()=>{setIndex(i);setError('');}} className={'w-full rounded-xl p-3 text-left text-sm '+(index===i?'bg-blue-50 text-cobalt font-semibold':'bg-slate-50 text-slate-700')}><span className="block text-xs">{i+1} / {source.scenes.length}</span>{item.scene.headline||'제목 없는 장면'}</button>)}</div></Card>
   <Card className="space-y-4 !p-6 min-w-0"><h2 className="font-semibold">장면 {index+1} · 미리보기</h2><div className="bg-slate-100 rounded-2xl p-4 flex justify-center"><Thumbnail key={entry.scene.id+size} component={MasterCard} inputProps={props} frameToDisplay={entry.frame} durationInFrames={entry.durationInFrames} compositionWidth={dims.width} compositionHeight={dims.height} fps={FPS} style={{width:'min(100%, 420px)',aspectRatio:dims.width+'/'+dims.height}}/></div><p className="text-xs text-slate-500">{dims.width} × {dims.height} · PNG · {entry.asset?'실제 원본 소재':entry.scene.visual?'원본 그래픽':'텍스트 전용 장면'}</p>{format==='thread'&&<label className="block text-sm font-semibold">게시글 초안<textarea readOnly className={inputClass+' mt-2'} rows={5} value={post.text}/><span className="block text-xs font-normal text-slate-500 mt-1">복사 가능한 원본 문장이에요. 실제 게시 전 길이와 내용을 확인해 주세요.</span></label>}<Button className="w-full" disabled={busy} onClick={exportImage}>{busy?'PNG를 만들고 있어요':'현재 장면 PNG 다운로드'}</Button>{error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}</Card>
  </div>
  <p className="text-xs text-slate-500">파생 페이지의 영구 저장, 텍스트 편집, 일괄 출력, 직접 발행은 아직 지원하지 않아요. 원본이 변경되면 기존 버전으로 내보내기를 차단해요. 최신 저장 원본을 명시적으로 가져올 수 있어요.</p>
 </main>;
}
