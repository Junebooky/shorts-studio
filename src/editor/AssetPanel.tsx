import {useRef,useState} from 'react';
import {FolderOpen,Trash2} from 'lucide-react';
import {Card,Button,inputClass} from '../design-system/components';
import type {Project} from '../core/project';
import {AssetSchema,assetUsage,assetLibrarySummary,type Asset} from '../core/assets';
type Filter='all'|'production'|'reference';
const kinds={image:'이미지',video:'영상',audio:'음성'};
const mb=(bytes:number)=>(bytes/1024/1024).toFixed(1);
export function AssetPanel({project:p,disabled,onRun,onChange,onNote}:{project:Project;disabled:boolean;onRun:(fn:()=>Promise<void>)=>void;onChange:(patch:Partial<Project>)=>void;onNote:(s:string)=>void}){
 const [role,setRole]=useState<'production'|'reference'>('production'),[filter,setFilter]=useState<Filter>('all'),[uploading,setUploading]=useState(false);
 const lock=useRef(false),assets=p.assets??[],summary=assetLibrarySummary(assets),locked=disabled||uploading||p.id==='demo';
 const visible=assets.filter(a=>filter==='all'||a.role===filter);
 const upload=async(file:File)=>{
  if(summary.count>=100||!file.size||file.size>50*1024*1024||summary.bytes+file.size>200*1024*1024)throw new Error('소재는 최대 100개, 파일당 50MB, 전체 200MB까지 추가할 수 있어요.');
  const ext=file.name.split('.').pop()?.toLowerCase()??'';
  if(!['png','jpg','jpeg','webp','mp4','wav','mp3'].includes(ext))throw new Error('지원하지 않는 소재 형식입니다.');
  const query=new URLSearchParams({id:p.id,name:file.name,ext,role});
  const res=await fetch('/api/assets?'+query,{method:'POST',body:file});let data;try{data=await res.json();}catch{throw new Error('소재 서버 응답을 읽지 못했습니다.');}if(!res.ok)throw new Error(typeof data?.error==='string'?data.error:'소재 등록 실패');
  const a=AssetSchema.parse(data);if(a.role!==role||!a.path.startsWith('workspace/'+p.id+'/assets/'))throw new Error('등록된 소재 정보가 요청과 다릅니다.');
  onChange({assets:[...assets,a]});setFilter('all');onNote('소재를 추가했어요. 프로젝트를 저장해 주세요.');
 };
 const startUpload=(file:File)=>{if(locked||lock.current)return;lock.current=true;setUploading(true);onRun(async()=>{try{await upload(file);}finally{lock.current=false;setUploading(false);}});};
 return <Card className="lg:col-span-2 xl:col-span-3 space-y-3">
  <div className="flex items-center gap-2"><FolderOpen size={18} className="text-cobalt"/><h2 className="font-black">영상 소재와 참고 자료</h2></div>
  <p className="text-xs text-slate-500">영상에 넣을 소재와 참고용 파일을 구분해 주세요. 파일은 이 기기에 저장되고 AI 제작 요청에 포함돼요.</p>
  <div className="grid sm:grid-cols-2 gap-3">
   <div className="space-y-2"><label className="block text-xs font-bold">소재 용도<select aria-label="소재 용도" className={inputClass+' mt-1'} disabled={locked} value={role} onChange={e=>setRole(e.target.value as typeof role)}><option value="production">영상 제작용</option><option value="reference">스타일 참고용</option></select></label>
    <p className="text-xs text-slate-500">{role==='production'?'AI가 실제 장면 또는 배경음악에 배치할 수 있어요.':'AI가 참고만 하는 자료예요. 영상에 직접 삽입할 수 없어요.'}</p>
    <label className="block text-xs font-bold">소재 추가하기<input aria-label="소재 추가하기" className={inputClass+' mt-1'} type="file" accept=".png,.jpg,.jpeg,.webp,.mp4,.wav,.mp3" disabled={locked||summary.count>=100||summary.bytes>=200*1024*1024} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)startUpload(file);}}/></label>
    <p className="text-xs text-slate-500">PNG/JPEG/WebP/MP4/WAV/MP3 · 파일당 50MB · 총 200MB</p>
    {uploading&&<p role="status" className="text-xs text-cobalt">원본 파일 및 미디어 정보 확인 중…</p>}
   </div>
   <label className="block text-xs font-bold">참고 자료 활용 방법<textarea aria-label="참고 자료 활용 방법" className={inputClass+' mt-1 min-h-24'} disabled={locked} maxLength={4000} value={p.referenceBrief??''} onChange={e=>onChange({referenceBrief:e.target.value})} placeholder="예: 선택한 스타일은 유지하고 참고 영상의 색상과 정보 배치 참고"/><span className="block text-right font-normal text-slate-500">{(p.referenceBrief??'').length} / 4,000</span></label>
  </div>
  <div className="rounded-xl bg-slate-50 p-3 space-y-1"><div className="flex justify-between text-xs"><span>등록 소재 {summary.count} / 100개</span><span>{mb(summary.bytes)} / 200MB</span></div><progress aria-label="등록 소재 용량" className="w-full accent-cobalt" max={200*1024*1024} value={summary.bytes}/></div>
  <div className="flex flex-wrap gap-2" role="group" aria-label="소재 목록 필터">{([['all','전체',summary.count],['production','제작용',summary.production],['reference','참고용',summary.reference]] as const).map(([id,label,count])=><Button type="button" key={id} variant={filter===id?'primary':'secondary'} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label} {count}</Button>)}</div>
  {!visible.length?<div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500">{assets.length?'이 용도로 추가한 소재가 없어요. 다른 용도를 선택하거나 소재를 추가해 보세요.':'아직 추가한 소재가 없어요. 영상에 사용할 파일이나 참고 자료를 추가해 보세요.'}</div>:<div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{visible.map(a=><AssetTile key={p.id+':'+a.id} asset={a} project={p} locked={locked} onRemove={()=>onChange({assets:assets.filter(x=>x.id!==a.id)})} onNotes={notes=>onChange({assets:assets.map(x=>x.id===a.id?{...x,notes}:x)})} onRole={next=>onChange({assets:assets.map(x=>x.id===a.id?{...x,role:next}:x)})}/>)}</div>}
  <p className="text-xs text-slate-500">참고용 파일은 영상에 자동으로 들어가지 않아요. AI가 자료를 검토해 연출에 반영해야 해요. 목록에서 삭제해도 원본 파일은 복구를 위해 남겨둬요.</p>
 </Card>;
}
function AssetTile({asset:a,project:p,locked,onRemove,onNotes,onRole}:{asset:Asset;project:Project;locked:boolean;onRemove:()=>void;onNotes:(s:string)=>void;onRole:(r:Asset['role'])=>void}){
 const [failed,setFailed]=useState(false),usage=assetUsage(p,a.id);
 const roleLabel=a.role==='production'?'제작용':'참고용';
 return <div className="bg-slate-50 rounded-2xl p-3 space-y-2">
  <div className="flex items-center justify-between gap-1"><span className="text-xs font-bold text-cobalt">{roleLabel} · {kinds[a.kind]}</span><Button type="button" variant="ghost" aria-label={a.name+' 제거'} disabled={locked||usage.used} onClick={onRemove}><Trash2 size={14}/></Button></div>
  {failed?<div className="rounded-xl bg-white p-3 text-xs text-amber-800">미리보기를 읽지 못했습니다. 원본 파일을 확인하세요. <Button type="button" variant="ghost" onClick={()=>setFailed(false)}>다시 확인</Button></div>:a.kind==='image'?<img alt={a.name} src={'/'+a.path} onError={()=>setFailed(true)} loading="lazy" className="w-full h-28 rounded-xl object-contain bg-white"/>:a.kind==='video'?<video controls preload="metadata" src={'/'+a.path} onError={()=>setFailed(true)} className="w-full h-28 rounded-xl bg-black"/>:<audio controls preload="none" src={'/'+a.path} onError={()=>setFailed(true)} className="w-full"/>}
  <p className="text-xs font-bold break-all">{a.name}</p>
  <p className="text-[10px] text-slate-500">{(a.bytes/1024).toFixed(1)} KB {a.durationMs?'· '+(a.durationMs/1000).toFixed(1)+'초':''} {usage.used?'· 영상에 사용 중':''}</p>
  {usage.used&&<p className="text-xs text-slate-600">{usage.sceneIds.length?'장면 '+usage.sceneIds.length+'개에 배치됨':''}{usage.music?' · 배경음악 사용 중':''} · 배치 해제 후 용도 변경 가능</p>}
  {a.role==='reference'&&<p className="text-xs text-slate-500">참고만 가능 · 영상 배치 금지</p>}
  <Button type="button" variant="secondary" className="w-full" disabled={locked||usage.used} onClick={()=>{const next=a.role==='reference'?'production':'reference';if(window.confirm(next==='production'?'참고 자료를 실제 영상에 사용할 수 있는 제작 소재로 변경할까요? 변경만으로 영상에 삽입되지는 않습니다.':'이 소재를 참고 전용으로 변경할까요? 실제 영상에는 배치할 수 없습니다.'))onRole(next);}}>{a.role==='reference'?'제작용으로 변경':'참고용으로 변경'}</Button>
  <input aria-label={a.name+' 활용 지침'} className={inputClass} disabled={locked} maxLength={2000} value={a.notes} placeholder="활용 방법, 출처, 참고할 특징" onChange={e=>onNotes(e.target.value)}/>
 </div>;
}
