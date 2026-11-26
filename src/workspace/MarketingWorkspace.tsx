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
import {useThreads} from './useThreads';
import {ThreadStudio} from './ThreadStudio';
import {sourceToThread,threadReady} from './thread-news';
import {ContentLaunchPanel} from './ContentLaunchPanel';
import {createContentPlan,firstAvailableFormat,cardTopicFields,formatLabels,type ContentFormat,type ContentPlan,type VideoLaunch} from './content-plan';
import {newCardDeck} from './card-news';
import {videoToCard} from './video-to-card';
import {NarrationSourceSchema} from '../core/content-source';
import type {Project} from '../core/project';
import {useSharedContent} from './useSharedContent';
import {newSharedContent,captureVideoSource,sharedCardBrand,sharedVideoPalette,type SharedContent} from './shared-content';
import {cardMatches,threadMatches,formatOutcome,nextContentFormat,finishContent,canSkipFormat,recoverSavedProgress,type Derivative} from './content-progress';
import './workspace.css';

const icons={home:House,video:Clapperboard,'card-news':Images,threads:MessageSquareText,research:TrendingUp,publishing:CalendarDays,analytics:BarChart3,library:FolderOpen};
export function MarketingWorkspace({children}:{children:(launch:VideoLaunch|null,onLaunchRejected:(message:string)=>void,onSourceReady:(project:Project,launchId:string,topic:string)=>void)=>ReactNode}){
 const [active,setActive]=useState<WorkspaceId>(defaultWorkspace);
 const shared=useSharedContent(),record=shared.record,plan=record?.plan??null;
 const [topic,setTopic]=useState(record?.plan.topic??''),[formats,setFormats]=useState<ContentFormat[]>(record?.plan.formats??[]),[launch,setLaunch]=useState<VideoLaunch|null>(null),[planNotice,setPlanNotice]=useState('');
 const [sourceTitle,setSourceTitle]=useState(''),[sourceScript,setSourceScript]=useState('');
 const cardOpened=useRef<string|null>(null),videoOpened=useRef<string|null>(null),launchOwner=useRef<{launchId:string;recordId:string}|null>(null);
 const [expanded,setExpanded]=useState<GroupId[]>(['video']);
 const [mobileOpen,setMobileOpen]=useState(false);
 const content=useRef<HTMLDivElement>(null);
 const video=useRef<HTMLDivElement>(null);
 const {group,item}=findWorkspace(active);
 const campaigns=useCampaigns();
 const brand=useBrandKit();
 const cardNews=useCardNews();
 const threads=useThreads();
 const campaign=campaigns.store.campaigns.find(c=>c.id===campaigns.store.activeId);
 const flow=record?recoverSavedProgress(record,cardNews.saved,threads.saved):null;
 const pending=flow?nextContentFormat(flow):null;
 const currentFormat=active==='video-studio'&&record&&videoOpened.current===record.id?'video':active==='card-create'&&record&&cardMatches(cardNews.draft,record)?'card':active==='thread-create'&&record&&threadMatches(threads.draft,record)?'thread':null;
 const currentDirty=currentFormat==='card'?cardNews.dirty:currentFormat==='thread'?threads.dirty:false;
 const markSaved=(format:Derivative)=>{const raw=shared.current();if(!raw)return;const next=recoverSavedProgress(raw,cardNews.saved,threads.saved);if(nextContentFormat(next)!==format)return;if(!shared.commit(finishContent(next,format,'saved')))setPlanNotice('초안은 저장했어요. 제작 단계는 홈에서 다시 확인해 주세요.');};
 const saveCard=()=>{const raw=shared.current(),ok=cardNews.save();if(ok&&raw&&cardMatches(cardNews.draft,raw))markSaved('card');return ok;};
 const saveThread=()=>{const raw=shared.current(),ok=threads.save();if(ok&&raw&&threadMatches(threads.draft,raw)&&threadReady(threads.draft))markSaved('thread');return ok;};
 const skipFormat=(format:ContentFormat)=>{const raw=shared.current();if(!raw)return;const next=recoverSavedProgress(raw,cardNews.saved,threads.saved);if(!canSkipFormat(next,format))return;if(!window.confirm(formatLabels[format]+' 제작을 이번 계획에서 건너뛸까요? 기존 저장본은 유지돼요.'))return;if(shared.commit(finishContent(next,format,'skipped')))setPlanNotice(formatLabels[format]+' 제작을 건너뛰었어요.');};
 const select=(id:WorkspaceId)=>{
  if(active==='video-studio'&&id!==active)video.current?.querySelectorAll<HTMLMediaElement>('video,audio').forEach(media=>media.pause());
  const next=findWorkspace(id);setExpanded(previous=>previous.includes(next.group.id)?previous:[...previous,next.group.id]);
  setActive(id);setMobileOpen(false);
  if(id!==active){window.scrollTo({top:0});requestAnimationFrame(()=>content.current?.focus({preventScroll:true}));}
 };
 const convertCard=(next:SharedContent)=>{
  try{const deck=videoToCard(next,()=>crypto.randomUUID());if(!window.confirm('원본 영상으로 카드뉴스 '+deck.pages.length+'장을 만들까요? 현재 편집 중인 카드뉴스는 교체되며 기존 저장본은 저장 전까지 유지돼요.'))return;
   cardNews.change(deck,deck.pages[0].id);cardOpened.current=next.id;select('card-create');setPlanNotice('영상 원본에서 카드뉴스 '+deck.pages.length+'장을 구성했어요. 각 페이지를 확인하고 저장해 주세요.');
  }catch(e){setPlanNotice(e instanceof Error?e.message:'카드뉴스를 만들지 못했어요.');}
 };
 const convertThread=(next:SharedContent)=>{
  try{const deck=sourceToThread(next,()=>crypto.randomUUID());if(!window.confirm(next.source?'공통 원고로 스레드 '+deck.posts.length+'개를 구성할까요? 현재 초안은 교체되며 저장 전까지 기존 저장본은 유지돼요.':'공통 주제로 새 스레드 초안을 열까요? 저장 전까지 기존 저장본은 유지돼요.'))return;
   threads.change(deck);select('thread-create');setPlanNotice(next.source?'공통 원고에서 게시글 '+deck.posts.length+'개를 구성했어요. 내용과 글자 수를 확인해 주세요.':'공통 주제로 스레드 작성 화면을 열었어요. 원고를 직접 작성해 주세요.');
  }catch(e){setPlanNotice(e instanceof Error?e.message:'스레드를 구성하지 못했어요.');}
 };
 const openFormat=(format:ContentFormat,next:SharedContent)=>{
  const current=recoverSavedProgress(next,cardNews.saved,threads.saved),target=nextContentFormat(current);
  if(format!==target&&!(format==='video'&&target===null&&next.plan.formats.length===1&&next.source?.kind==='video')){setPlanNotice('현재 제작 단계부터 이어서 작업해 주세요.');return;}
  if(current!==next&&!shared.commit(current))return;
  if(format==='thread'&&cardNews.dirty&&cardMatches(cardNews.draft,next)&&formatOutcome(current,'card')==='saved'&&!window.confirm('카드뉴스의 저장하지 않은 변경 사항은 그대로 남겨두고 스레드를 만들까요?'))return;
  if(format==='video'){
   if(videoOpened.current!==next.id){
    const id=crypto.randomUUID();const source=next.source;
    const nextLaunch:VideoLaunch={id,topic:next.plan.topic,brandPalette:sharedVideoPalette(next),...(source?.kind==='manual'?{sourceScript:{title:source.title,script:source.script}}:source?.kind==='video'?{projectId:source.projectId}:{})};
    launchOwner.current={launchId:id,recordId:next.id};setLaunch(nextLaunch);videoOpened.current=next.id;
    setPlanNotice(source?.kind==='video'?'공통 원본에 연결된 저장 영상을 열어요.':source?.kind==='manual'?'공통 원고를 영상 제작에 전달했어요. 제작 확인 후 음성과 장면을 만들어요.':'공통 주제를 영상 제작에 전달했어요. 제작 확인 단계에서 직접 시작해 주세요.');
   }else setPlanNotice('이 제작 계획의 기존 영상 작업 공간을 열었어요.');
   select('video-studio');return;
  }
  if(format==='card'){
   if(cardMatches(cardNews.draft,next)){cardOpened.current=next.id;select('card-create');setPlanNotice('저장된 원본 카드뉴스를 열었어요.');return;}
   if(cardOpened.current!==next.id&&next.source?.kind==='video'){convertCard(next);return;}
   if(cardOpened.current!==next.id){
    if(!window.confirm('현재 카드뉴스 편집 내용을 새 초안으로 바꿀까요? 저장하기 전까지 기존 저장본은 유지돼요.')){setPlanNotice('기존 카드뉴스를 유지했어요. 제작 계획에서 다시 열 수 있어요.');return;}
    const deck=newCardDeck(crypto.randomUUID(),sharedCardBrand(next)),fields=cardTopicFields(next.source?.title??next.plan.topic);
    cardNews.change({...deck,planId:next.id,name:fields.name,pages:[{...deck.pages[0],title:fields.title,body:fields.body}]},deck.pages[0].id);cardOpened.current=next.id;
   }
   select('card-create');setPlanNotice(next.source?'공통 원본을 참고해 카드뉴스 페이지를 구성해 주세요.':'공통 주제와 저장된 브랜드를 카드뉴스 초안에 적용했어요. 페이지 내용은 직접 구성해 주세요.');return;
  }
  if(threadMatches(threads.draft,next)){select('thread-create');setPlanNotice('이 제작 계획의 스레드 초안을 열었어요.');return;}
  convertThread(next);
 };
 const capture=(project:Project,launchId:string,actualTopic:string)=>{
  const current=shared.current(),owner=launchOwner.current;
  if(!current||!owner||owner.launchId!==launchId||owner.recordId!==current.id)return;
  if(actualTopic!==current.plan.topic){setPlanNotice('영상 주제를 변경해 제작했으므로 기존 공통 원본을 유지했어요. 영상은 내 영상에서 확인할 수 있어요.');return;}
  try{const next=captureVideoSource(current,project);if(shared.commit(next))setPlanNotice('숏츠 초안이 준비됐어요. 영상과 음성을 확인해 주세요.');else setPlanNotice('영상은 저장됐지만 공통 원본은 저장하지 못했어요. 마케팅 홈에서 저장 오류를 확인해 주세요.');}
  catch(e){setPlanNotice(e instanceof Error?e.message:'공통 원본을 가져오지 못했어요.');}
 };
 const startPlan=()=>{
  try{
   const nextPlan=createContentPlan(topic,formats);
   const narration=sourceScript.trim()||sourceTitle.trim()?NarrationSourceSchema.parse({title:sourceTitle.trim()||nextPlan.topic.slice(0,90),script:sourceScript}):undefined;
   if(record?.source&&!window.confirm('현재 공통 제작 원본을 새 계획으로 교체할까요? 저장된 영상, 카드뉴스, 스레드는 유지돼요.'))return;
   const next=newSharedContent(crypto.randomUUID(),nextPlan,brand.saved,narration);
   if(!shared.commit(next)){setPlanNotice('공통 제작 계획을 저장하지 못했어요. 저장 오류를 확인해 주세요.');return;}
   setSourceTitle('');setSourceScript('');setPlanNotice('제작 계획을 준비했어요.');
   const first=firstAvailableFormat(next.plan);if(first)openFormat(first,next);else setPlanNotice('콘텐츠 형식을 선택해 주세요.');
  }catch{setPlanNotice('주제와 콘텐츠 형식을 확인해 주세요. 직접 원고를 입력할 때는 한국어 10~1,000자와 제목 90자 이하가 필요해요.');}
 };
 const nextLabel=(f:ContentFormat)=>f==='video'?'숏츠 영상 이어서 만들기':f==='card'&&flow?.source?.kind==='video'?'이 영상으로 카드뉴스 만들기':f==='thread'&&flow?.source?.kind==='video'?'이 영상으로 스레드 만들기':formatLabels[f]+' 이어서 만들기';
 const resume=flow?(pending?{label:nextLabel(pending),description:pending==='video'?'숏츠 제작을 이어서 진행해 주세요.':flow.source?.kind==='video'?'저장된 숏츠 원본을 활용해 '+formatLabels[pending]+' 작업을 이어가세요.':formatLabels[pending]+' 작업을 이어가세요.',action:pending,...(canSkipFormat(flow,pending)?{skip:()=>skipFormat(pending)}:{})}:flow.plan.formats.length===1&&flow.source?.kind==='video'?{label:'숏츠 영상 다시 보기',description:'숏츠 초안이 저장됐어요. 영상 검수와 내보내기를 이어서 진행할 수 있어요.',action:'video' as const}:{label:'',description:'선택한 작업을 마쳤어요. 저장한 초안은 각 작업 공간에서 확인할 수 있어요.'}):undefined;
 const handoff=!!flow&&!!currentFormat&&flow.plan.formats.length>1&&!!formatOutcome(flow,currentFormat)&&(!pending||pending!==currentFormat);
 const originDetails=flow&&flow.plan.formats.length>1&&flow.source&&currentFormat&&currentFormat!=='video'?<details className="rounded-xl bg-slate-50 p-3 text-sm"><summary className="cursor-pointer font-medium text-slate-600">사용한 원본 보기</summary><p className="mt-3 font-semibold">{flow.source.title}</p><p className="mt-2 text-xs text-slate-500">{flow.source.kind==='video'?'영상 원본 · 리비전 '+flow.source.revision:'직접 작성한 원고'}</p><p data-testid="common-narration" className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600">{flow.source.script}</p></details>:null;
 return <div className="marketing-shell">
  <aside className="marketing-sidebar" aria-label="마케팅 작업 공간">
   <div className="marketing-brand">
    <span className="marketing-brand-icon"><LayoutGrid size={21} aria-hidden="true"/></span>
    <div className="min-w-0"><p className="text-sm font-bold text-slate-900">Shorts Studio</p><p className="text-xs text-slate-500">마케팅 작업 공간</p></div>
    <button type="button" className="marketing-mobile-toggle" aria-label={mobileOpen?'마케팅 메뉴 닫기':'마케팅 메뉴 열기'} aria-expanded={mobileOpen} aria-controls="marketing-navigation" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?<X size={22}/>:<Menu size={22}/>}</button>
   </div>
   <nav id="marketing-navigation" aria-label="마케팅 메뉴" className={'marketing-navigation'+(mobileOpen?' is-open':'')}>
    <button type="button" className={'marketing-group-button marketing-home-link'+(active==='marketing-home'?' is-selected is-active':'')} aria-current={active==='marketing-home'?'page':undefined} onClick={()=>select('marketing-home')}><span>마케팅 홈</span></button>
    {campaign&&<div className="marketing-campaign-context"><p className="text-xs text-slate-500">선택한 캠페인</p><p className="text-sm font-semibold break-words">{campaign.name}</p><button type="button" className="text-xs text-cobalt" onClick={()=>select('marketing-home')}>캠페인 관리</button></div>}
    <p className="marketing-nav-label">작업 공간</p>
    {workspaceGroups.filter(section=>section.id!=='home').map(section=>{
     const Icon=icons[section.id],open=expanded.includes(section.id),selected=group.id===section.id;
     return <div key={section.id} className="marketing-nav-group">
      <button type="button" className={'marketing-group-button'+(selected?' is-selected':'')} aria-expanded={open} aria-controls={'workspace-'+section.id} onClick={()=>setExpanded(previous=>toggleGroup(previous,section.id))}>
       <span>{section.label}</span>{open?<ChevronDown size={16} aria-hidden="true"/>:<ChevronRight size={16} aria-hidden="true"/>}
      </button>
      <div id={'workspace-'+section.id} hidden={!open} className="marketing-nav-children">
       {section.items.map(entry=><button key={entry.id} type="button" className={'marketing-child-button'+(active===entry.id?' is-active':'')} aria-current={active===entry.id?'page':undefined} onClick={()=>select(entry.id)}><span>{entry.label}</span>{!entry.ready&&<small>준비 중</small>}</button>)}
      </div>
     </div>;
    })}
   </nav>
  </aside>
  <div ref={content} tabIndex={-1} className="marketing-content" aria-label={item.label}>
   {plan&&active!=='marketing-home'&&<div className="content-plan-strip" aria-label="현재 제작 작업"><div className="min-w-0"><p className="text-xs text-slate-500">{currentFormat?formatLabels[currentFormat]+' 제작':'제작 계획'}</p><p className="text-sm font-semibold truncate" title={plan.topic}>{plan.topic}</p></div><Button variant="ghost" onClick={()=>select('marketing-home')}>제작 계획 보기</Button></div>
   {planNotice&&plan&&active!=='marketing-home'&&<p role="status" className="content-plan-notice">{planNotice}</p>}
   {/* Keep the video workspace mounted: drafts, provider requests, polling and project state must not reset when navigating. */}
   <div ref={video} className="marketing-video-workspace" hidden={active!=='video-studio'}>{children(launch,message=>{videoOpened.current=null;setPlanNotice(message);},capture)}</div>
   {active==='marketing-home'&&<MarketingHome campaigns={campaigns} onNavigate={select} launcher={<ContentLaunchPanel topic={topic} formats={formats} onTopic={setTopic} onFormats={setFormats} onStart={startPlan} plan={plan} onOpen={format=>{if(record)openFormat(format,record);}} notice={planNotice} sourceTitle={sourceTitle} sourceScript={sourceScript} onSourceTitle={setSourceTitle} onSourceScript={setSourceScript} resume={resume} storageError={shared.error} onReload={()=>{const loaded=shared.reload();setTopic(loaded?.plan.topic??'');setFormats(loaded?.plan.formats??[]);setSourceTitle('');setSourceScript('');videoOpened.current=null;cardOpened.current=null;launchOwner.current=null;setPlanNotice('저장된 제작 원본을 다시 불러왔어요.');}} readOnly={shared.readOnly}/>}/>}
   {active==='brand-kit'&&<BrandKitPanel brand={brand}/>}
   {active==='card-create'&&<CardStudio studio={{...cardNews,save:saveCard}} brand={brand.saved} campaign={campaign} sourcePanel={originDetails}/>}
   {(active==='thread-create'||active==='thread-repurpose')&&<ThreadStudio studio={{...threads,save:saveThread}} sourcePanel={originDetails}/>}
   {handoff&&flow&&<section data-testid="content-handoff" className="mt-6 mb-8"><Card className="space-y-4"><div><h2 className="text-lg font-semibold">{pending?currentFormat==='video'?'숏츠 초안이 준비됐어요.':'현재 초안을 저장했어요.':'선택한 콘텐츠 작업을 마쳤어요.'}</h2><p className="mt-2 text-sm text-slate-600">{pending?formatLabels[pending]+' 작업을 이어갈 수 있어요. '+(flow.source?'저장한 원본을 활용해요.':'같은 주제로 이어서 작업해요.'):'저장한 초안은 각 작업 공간에서 확인할 수 있어요. 영상 최종 검수와 발행은 별도로 진행해 주세요.'}</p>{flow.source?.kind==='video'&&<p className="mt-2 text-xs text-slate-500">사용할 원본 · {flow.source.title}</p>}{currentDirty&&<p className="mt-2 text-xs text-slate-500">변경 사항을 먼저 저장해 주세요.</p>}</div><div className="flex flex-wrap gap-3">{pending?<><Button disabled={currentDirty||!!shared.error} onClick={()=>{const raw=shared.current();if(raw)openFormat(pending,raw);}}>{nextLabel(pending)}</Button>{canSkipFormat(flow,pending)&&<Button variant="ghost" disabled={currentDirty||!!shared.error} onClick={()=>skipFormat(pending)}>이번에는 건너뛰기</Button>}</>:<Button onClick={()=>select('marketing-home')}>마케팅 홈으로</Button>} {pending&&<Button variant="ghost" onClick={()=>select('marketing-home')}>나중에 만들기</Button>}</div></Card></section>}
   {active!=='video-studio'&&active!=='marketing-home'&&active!=='brand-kit'&&active!=='card-create'&&active!=='thread-create'&&active!=='thread-repurpose'&&<main className="marketing-module">
    <p className="text-sm text-slate-500">{group.label}</p>
    <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">{item.label}</h1>
    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.description}</p>
    {active==='video-guide'?<Card className="mt-6 space-y-4 max-w-2xl">
     <h2 className="text-lg font-semibold">영상 제작 순서</h2>
     <ol className="list-decimal pl-5 space-y-3 text-sm text-slate-700"><li>영상 주제와 제작 방향을 정해요.</li><li>대본과 목소리를 준비하고 발화 시간을 확인해요.</li><li>브랜드 컬러를 선택하고 대본에 맞춰 장면을 구성해요.</li><li>초안 영상을 재생하고 화면과 음성을 확인해요.</li><li>필수 기술 검사와 실제 검수를 마친 뒤 최종 영상을 만들어요.</li></ol>
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
