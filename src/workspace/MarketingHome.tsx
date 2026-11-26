import {useState,type FormEvent} from 'react';
import {ArrowUpRight,Clapperboard,Images,MessageSquareText,TrendingUp,Plus,Target,Check} from 'lucide-react';
import {Button,Card,inputClass} from '../design-system/components';
import {campaignBriefSchema,emptyCampaignBrief,saveCampaign,selectCampaign,removeCampaign,type Campaign,type CampaignBrief} from './campaigns';
import type {WorkspaceId} from './navigation';
import type {useCampaigns} from './useCampaigns';
type Campaigns=ReturnType<typeof useCampaigns>;
const shortcuts=[
 {id:'video-studio',name:'영상 만들기',description:'AI 대본부터 영상 편집까지',icon:Clapperboard,ready:true},
 {id:'card-create',name:'카드뉴스 제작',description:'페이지별 메시지와 디자인',icon:Images,ready:false},
 {id:'thread-create',name:'스레드 제작',description:'핵심 메시지를 연속 게시글로',icon:MessageSquareText,ready:false},
 {id:'trending-videos',name:'최신 인기영상 추출',description:'콘텐츠 아이디어 탐색',icon:TrendingUp,ready:false},
] as const;
function CampaignForm({campaign,onSave,onCancel,readOnly}:{campaign?:Campaign;onSave:(draft:CampaignBrief)=>boolean;onCancel:()=>void;readOnly:boolean}){
 const [draft,setDraft]=useState<CampaignBrief>(campaign?{name:campaign.name,goal:campaign.goal,audience:campaign.audience,message:campaign.message}:emptyCampaignBrief);
 const [error,setError]=useState('');
 const change=(key:keyof CampaignBrief,value:string)=>setDraft(old=>({...old,[key]:value}));
 const submit=(e:FormEvent)=>{e.preventDefault();const parsed=campaignBriefSchema.safeParse(draft);if(!parsed.success){setError('캠페인 이름과 입력 길이를 확인해 주세요.');return;}setError('');onSave(parsed.data);};
 return <form className="space-y-4" onSubmit={submit}>
  <h3 className="text-lg font-semibold">{campaign?'캠페인 편집':'새 캠페인'}</h3>
  <label className="block text-sm font-medium">캠페인 이름<input className={inputClass+' mt-1.5'} value={draft.name} required maxLength={100} onChange={e=>change('name',e.target.value)} placeholder="예: 신제품 소개 캠페인"/></label>
  <label className="block text-sm font-medium">캠페인 목표<textarea className={inputClass+' mt-1.5 resize-y'} rows={2} maxLength={500} value={draft.goal} onChange={e=>change('goal',e.target.value)} placeholder="어떤 결과를 만들고 싶나요?"/></label>
  <label className="block text-sm font-medium">캠페인 타깃 고객<textarea className={inputClass+' mt-1.5 resize-y'} rows={2} maxLength={500} value={draft.audience} onChange={e=>change('audience',e.target.value)} placeholder="누구에게 전달할 콘텐츠인가요?"/></label>
  <label className="block text-sm font-medium">캠페인 핵심 메시지<textarea className={inputClass+' mt-1.5 resize-y'} rows={3} maxLength={1000} value={draft.message} onChange={e=>change('message',e.target.value)} placeholder="사람들이 기억했으면 하는 한 가지는 무엇인가요?"/></label>
  {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
  <div className="flex flex-wrap gap-2"><Button type="submit" disabled={readOnly||!draft.name.trim()}>캠페인 저장</Button><Button type="button" variant="ghost" onClick={onCancel}>취소</Button></div>
 </form>;
}
export function MarketingHome({campaigns,onNavigate}:{campaigns:Campaigns;onNavigate:(id:WorkspaceId)=>void}){
 const {store,error,readOnly,commit,reload}=campaigns;
 const active=store.campaigns.find(c=>c.id===store.activeId);
 const [editing,setEditing]=useState<string|null>(null);
 const [message,setMessage]=useState('');
 const editCampaign=store.campaigns.find(c=>c.id===editing);
 const startEdit=(id:string)=>{setMessage('');setEditing(id);};
 return <main className="marketing-module marketing-home">
  <div className="marketing-home-heading"><div><p className="text-sm font-medium text-cobalt">마케팅 작업 공간</p><h1 className="text-3xl font-bold tracking-tight mt-2">오늘은 어떤 콘텐츠를 만들까요?</h1><p className="text-sm text-slate-600 mt-3 leading-relaxed">하나의 캠페인에서 핵심 메시지를 정하고 필요한 제작 도구를 선택해 보세요.</p></div><Button disabled={readOnly||store.campaigns.length>=100} onClick={()=>startEdit('new')}><Plus size={18}/>새 캠페인</Button></div>
  <section aria-label="콘텐츠 제작 도구" className="marketing-shortcuts">
   {shortcuts.map(tool=><button type="button" className="marketing-shortcut" key={tool.id} onClick={()=>onNavigate(tool.id)}><div className="flex justify-between items-center"><span className="marketing-tool-icon"><tool.icon size={23} aria-hidden="true"/></span><ArrowUpRight size={17} className="text-slate-400" aria-hidden="true"/></div><span className="block text-base font-semibold mt-4">{tool.name}</span><span className="block text-sm text-slate-600 mt-1">{tool.description}</span>{!tool.ready&&<span className="block text-xs text-slate-500 mt-3">준비 중</span>}</button>)}
  </section>
  <section className="marketing-campaigns" aria-label="캠페인 관리">
   <div className="flex items-baseline justify-between gap-2"><h2 className="text-xl font-bold tracking-tight">내 캠페인</h2><span className="text-sm text-slate-500">{store.campaigns.length}개</span></div>
   <p className="text-sm text-slate-500">이 브라우저에 저장돼요. 아직 영상 프로젝트와 자동으로 연결되지 않아요.</p>
   {error&&<div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 space-y-2"><p>{error}</p><Button variant="secondary" onClick={reload}>새로 불러오기</Button></div>}
   {message&&<p role="status" className="text-sm text-emerald-700">{message}</p>}
   {editing!==null&&<Card><CampaignForm key={editing} campaign={editCampaign} readOnly={readOnly} onCancel={()=>setEditing(null)} onSave={draft=>{const ok=commit(()=>saveCampaign(store,draft,editCampaign?.id??crypto.randomUUID(),new Date().toISOString()));if(ok){setEditing(null);setMessage('캠페인을 저장했어요.');}return ok;}}/></Card>}
   {!store.campaigns.length&&editing===null&&<Card className="space-y-3"><div className="marketing-empty-icon"><Target size={27} aria-hidden="true"/></div><h3 className="text-lg font-semibold">첫 캠페인을 시작해 보세요</h3><p className="text-sm text-slate-600">목표와 타깃, 핵심 메시지를 정하면 다음 콘텐츠를 기획하기 쉬워져요.</p><Button variant="secondary" disabled={readOnly} onClick={()=>startEdit('new')}>캠페인 만들기</Button></Card>}
   {active&&<Card className="space-y-3"><div className="flex items-center gap-2 text-xs font-semibold text-cobalt"><Check size={16} aria-hidden="true"/>선택한 캠페인</div><h3 className="text-xl font-semibold break-words">{active.name}</h3><dl className="marketing-brief">{([['목표',active.goal],['타깃 고객',active.audience],['핵심 메시지',active.message]] as const).map(([label,value])=><div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="text-sm mt-1 whitespace-pre-wrap break-words">{value||'아직 정하지 않았어요.'}</dd></div>)}</dl><Button variant="secondary" disabled={readOnly} onClick={()=>startEdit(active.id)}>캠페인 편집</Button></Card>}
   {!!store.campaigns.length&&<Card className="space-y-2"><h3 className="text-sm font-semibold">캠페인 목록</h3>{store.campaigns.map(c=><div key={c.id} className="marketing-campaign-row"><div className="min-w-0 flex-1"><p className="font-medium text-sm break-words">{c.name}</p><p className="text-xs text-slate-500">{c.id===store.activeId?'선택됨':new Date(c.updatedAt).toLocaleDateString('ko-KR')}</p></div><Button variant="ghost" disabled={readOnly||c.id===store.activeId} aria-label={c.name+' 선택'} onClick={()=>{if(commit(()=>selectCampaign(store,c.id)))setMessage('캠페인을 선택했어요.');}}>선택</Button><Button variant="ghost" disabled={readOnly} aria-label={c.name+' 삭제'} onClick={()=>{if(window.confirm('이 브라우저에서 캠페인을 삭제할까요? 영상 프로젝트는 삭제되지 않아요.')&&commit(()=>removeCampaign(store,c.id))){setMessage('캠페인을 삭제했어요.');if(editing===c.id)setEditing(null);}}}>삭제</Button></div>)}</Card>}
  </section>
 </main>;
}
