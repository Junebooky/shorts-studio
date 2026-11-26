import {useRef,useState,type ReactNode} from 'react';
import {BarChart3,CalendarDays,ChevronDown,ChevronRight,Clapperboard,FolderOpen,House,Images,LayoutGrid,Menu,MessageSquareText,TrendingUp,X} from 'lucide-react';
import {Button,Card} from '../design-system/components';
import {defaultWorkspace,findWorkspace,toggleGroup,workspaceGroups,type GroupId,type WorkspaceId} from './navigation';
import {MarketingHome} from './MarketingHome';
import {useCampaigns} from './useCampaigns';
import {BrandKitPanel} from './BrandKitPanel';
import {useBrandKit} from './useBrandKit';
import {CardStudio} from './CardStudio';
import {useCardNews} from './useCardNews';
import './workspace.css';

const icons={home:House,video:Clapperboard,'card-news':Images,threads:MessageSquareText,research:TrendingUp,publishing:CalendarDays,analytics:BarChart3,library:FolderOpen};
export function MarketingWorkspace({children}:{children:ReactNode}){
 const [active,setActive]=useState<WorkspaceId>(defaultWorkspace);
 const [expanded,setExpanded]=useState<GroupId[]>(['video']);
 const [mobileOpen,setMobileOpen]=useState(false);
 const content=useRef<HTMLDivElement>(null);
 const video=useRef<HTMLDivElement>(null);
 const {group,item}=findWorkspace(active);
 const campaigns=useCampaigns();
 const brand=useBrandKit();
 const cardNews=useCardNews();
 const campaign=campaigns.store.campaigns.find(c=>c.id===campaigns.store.activeId);
 const select=(id:WorkspaceId)=>{
  if(active==='video-studio'&&id!==active)video.current?.querySelectorAll<HTMLMediaElement>('video,audio').forEach(media=>media.pause());
  const next=findWorkspace(id);setExpanded(previous=>previous.includes(next.group.id)?previous:[...previous,next.group.id]);
  setActive(id);setMobileOpen(false);
  if(id!==active){window.scrollTo({top:0});requestAnimationFrame(()=>content.current?.focus({preventScroll:true}));}
 };
 return <div className="marketing-shell">
  <aside className="marketing-sidebar" aria-label="마케팅 작업 공간">
   <div className="marketing-brand">
    <span className="marketing-brand-icon"><LayoutGrid size={21} aria-hidden="true"/></span>
    <div className="min-w-0"><p className="text-sm font-bold text-slate-900">Shorts Studio</p><p className="text-xs text-slate-500">마케팅 작업 공간</p></div>
    <button type="button" className="marketing-mobile-toggle" aria-label={mobileOpen?'마케팅 메뉴 닫기':'마케팅 메뉴 열기'} aria-expanded={mobileOpen} aria-controls="marketing-navigation" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?<X size={22}/>:<Menu size={22}/>}</button>
   </div>
   <nav id="marketing-navigation" aria-label="마케팅 메뉴" className={'marketing-navigation'+(mobileOpen?' is-open':'')}>
    <button type="button" className={'marketing-group-button marketing-home-link'+(active==='marketing-home'?' is-selected is-active':'')} aria-current={active==='marketing-home'?'page':undefined} onClick={()=>select('marketing-home')}><House size={19} aria-hidden="true"/><span>마케팅 홈</span></button>
    {campaign&&<div className="marketing-campaign-context"><p className="text-xs text-slate-500">선택한 캠페인</p><p className="text-sm font-semibold break-words">{campaign.name}</p><button type="button" className="text-xs text-cobalt" onClick={()=>select('marketing-home')}>캠페인 관리</button></div>}
    <p className="marketing-nav-label">작업 공간</p>
    {workspaceGroups.filter(section=>section.id!=='home').map(section=>{
     const Icon=icons[section.id],open=expanded.includes(section.id),selected=group.id===section.id;
     return <div key={section.id} className="marketing-nav-group">
      <button type="button" className={'marketing-group-button'+(selected?' is-selected':'')} aria-expanded={open} aria-controls={'workspace-'+section.id} onClick={()=>setExpanded(previous=>toggleGroup(previous,section.id))}>
       <Icon size={19} aria-hidden="true"/><span>{section.label}</span>{open?<ChevronDown size={16} aria-hidden="true"/>:<ChevronRight size={16} aria-hidden="true"/>}
      </button>
      <div id={'workspace-'+section.id} hidden={!open} className="marketing-nav-children">
       {section.items.map(entry=><button key={entry.id} type="button" className={'marketing-child-button'+(active===entry.id?' is-active':'')} aria-current={active===entry.id?'page':undefined} onClick={()=>select(entry.id)}><span>{entry.label}</span>{!entry.ready&&<small>준비 중</small>}</button>)}
      </div>
     </div>;
    })}
   </nav>
  </aside>
  <div ref={content} tabIndex={-1} className="marketing-content" aria-label={item.label}>
   {/* Keep the video workspace mounted: drafts, provider requests, polling and project state must not reset when navigating. */}
   <div ref={video} className="marketing-video-workspace" hidden={active!=='video-studio'}>{children}</div>
   {active==='marketing-home'&&<MarketingHome campaigns={campaigns} onNavigate={select}/>}
   {active==='brand-kit'&&<BrandKitPanel brand={brand}/>}
   {active==='card-create'&&<CardStudio studio={cardNews} brand={brand.saved} campaign={campaign}/>}
   {active!=='video-studio'&&active!=='marketing-home'&&active!=='brand-kit'&&active!=='card-create'&&<main className="marketing-module">
    <p className="text-sm text-slate-500">{group.label}</p>
    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">{item.label}</h1>
    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.description}</p>
    {active==='video-guide'?<Card className="mt-6 space-y-4 max-w-2xl">
     <h2 className="text-lg font-semibold">영상 제작 순서</h2>
     <ol className="list-decimal pl-5 space-y-3 text-sm text-slate-700"><li>영상 주제와 제작 방향을 정해요.</li><li>대본과 목소리를 준비하고 발화 시간을 확인해요.</li><li>영상 스타일과 장면 연출을 선택해요.</li><li>초안 영상을 재생하고 화면과 음성을 확인해요.</li><li>필수 기술 검사와 실제 검수를 마친 뒤 최종 영상을 만들어요.</li></ol>
     <Button onClick={()=>select('video-studio')}>영상 작업 공간으로 이동</Button>
    </Card>:<Card className="mt-6 max-w-2xl space-y-3">
     <div className="marketing-empty-icon"><LayoutGrid size={27} aria-hidden="true"/></div>
     <h2 className="text-lg font-semibold">아직 준비 중이에요</h2>
     <p className="text-sm leading-relaxed text-slate-600">이 메뉴는 앞으로 추가할 기능을 위한 공간이에요. 현재는 콘텐츠 생성, 외부 채널 연결 또는 데이터 수집을 할 수 없어요.</p>
     <Button variant="secondary" onClick={()=>select('video-studio')}>영상 작업 공간으로 이동</Button>
    </Card>}
   </main>}
  </div>
 </div>;
}
