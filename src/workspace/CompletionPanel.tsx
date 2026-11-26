import {useEffect,useRef,useState} from 'react';
import {Button,Card} from '../design-system/components';
import {MotionGraphic,motionLabels} from '../design-system/motion-graphics';
import {cardStorageKey,parseCardDeck} from './card-news';
import {threadStorageKey,threadDeckSchema,threadText} from './thread-news';
import {renderCard} from './card-renderer';
import {sharedContentKey,sharedContentSchema,type SharedContent} from './shared-content';
import type {ContentFormat} from './content-plan';
import type {useCardNews} from './useCardNews';
import type {useThreads} from './useThreads';
import {cardCanConfirm,threadCanConfirm,checkCardPages,chooseCompletion,matchingVideo,type VideoProof} from './completion-evidence';
type Props={record:SharedContent;cards:ReturnType<typeof useCardNews>;threads:ReturnType<typeof useThreads>;video:VideoProof|null};
export function CompletionPanel({record,cards,threads,video}:Props){
 // A new plan, selection or saved snapshot invalidates transient review confirmations.
 const snapshot=JSON.stringify([record,cards.draft,cards.stored,cards.dirty,cards.error,threads.draft,threads.stored,threads.dirty,threads.error]);
 return <CurrentCompletion key={snapshot} record={record} cards={cards} threads={threads} video={video}/>;
}
function CurrentCompletion({record,cards,threads,video}:Props){
 const [confirmed,setConfirmed]=useState<ContentFormat[]>([]),[latest,setLatest]=useState<ContentFormat>(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[stale,setStale]=useState(false),[replay,setReplay]=useState(0);
 const alive=useRef(true),invalidated=useRef(false);
 useEffect(()=>{alive.current=true;const invalidate=(e:StorageEvent)=>{if(e.key===null||[sharedContentKey,cardStorageKey,threadStorageKey].includes(e.key)){invalidated.current=true;setStale(true);setConfirmed([]);}};window.addEventListener('storage',invalidate);return ()=>{alive.current=false;window.removeEventListener('storage',invalidate);};},[]);
 const selected=record.plan.formats;
 const cardReady=!stale&&cardCanConfirm(record,cards),threadReady=!stale&&threadCanConfirm(record,threads);
 const completed:ContentFormat[]=stale?[]:[...(matchingVideo(record,video)?['video' as const]:[]),...(cardReady&&confirmed.includes('card')?['card' as const]:[]),...(threadReady&&confirmed.includes('thread')?['thread' as const]:[])];
 const graphic=chooseCompletion(selected,completed,latest);
 const samePlan=()=>{const raw=localStorage.getItem(sharedContentKey);return raw!==null&&JSON.stringify(sharedContentSchema.parse(JSON.parse(raw)))===JSON.stringify(record);};
 const cardCurrent=()=>{const raw=localStorage.getItem(cardStorageKey);return samePlan()&&raw!==null&&JSON.stringify(parseCardDeck(raw))===JSON.stringify(cards.draft);};
 const threadCurrent=()=>{const raw=localStorage.getItem(threadStorageKey);return samePlan()&&raw!==null&&JSON.stringify(threadDeckSchema.parse(JSON.parse(raw)))===JSON.stringify(threads.draft);};
 const mark=(format:ContentFormat)=>{if(!alive.current||invalidated.current)return;setConfirmed(old=>old.includes(format)?old:[...old,format]);setLatest(format);};
 const confirmCard=async()=>{if(!cardReady||busy)return;setBusy(true);setError('');try{
  if(!cardCurrent())throw Error('저장된 카드뉴스나 제작 계획이 변경됐어요. 다시 불러와 주세요.');
  const canvas=document.createElement('canvas');
  await checkCardPages(cards.draft,(page,i)=>renderCard(canvas,cards.draft,page,i));
  if(!cardCurrent())throw Error('검사 중 저장 내용이 변경됐어요. 다시 확인해 주세요.');
  mark('card');
 }catch(e){if(alive.current)setError(e instanceof Error?e.message:'페이지 검사를 완료하지 못했어요.');}finally{if(alive.current)setBusy(false);}};
 const confirmThread=()=>{if(!threadReady)return;setError('');try{if(!threadCurrent())throw Error('저장된 스레드나 제작 계획이 변경됐어요. 다시 불러와 주세요.');threadText(threads.draft);mark('thread');}catch(e){setError(e instanceof Error?e.message:'스레드를 확인하지 못했어요.');}};
 return <div data-testid="completion-panel"><Card className="space-y-3">
 <h2 className="text-lg font-semibold">제작 완성 확인</h2>
 <p className="text-sm text-slate-600">선택한 콘텐츠의 실제 결과를 확인해요. 저장된 초안만으로는 완성으로 표시하지 않아요.</p>
 {selected.includes('video')&&<p className="text-xs text-slate-600">{completed.includes('video')?'현재 원본 버전의 검수 승인과 최종 MP4 보관 기록을 확인했어요.':'현재 원본 버전의 검수 승인 및 최종 MP4 보관 기록이 필요해요.'}</p>}
 {selected.includes('card')&&<div className="space-y-2"><p className="text-xs text-slate-600">카드뉴스를 저장하고 모든 페이지의 내용과 화면을 직접 확인한 다음 눌러 주세요. 전체 페이지의 렌더링과 영역 초과를 검사해요.</p><Button variant="secondary" disabled={!cardReady||busy||completed.includes('card')} onClick={()=>void confirmCard()}>{busy?'전체 페이지 검사 중':completed.includes('card')?'카드뉴스 확인 완료':'카드뉴스 완성 확인'}</Button></div>}
 {selected.includes('thread')&&<div className="space-y-2"><p className="text-xs text-slate-600">게시글의 내용과 사실을 직접 확인하고 저장한 다음 눌러 주세요. 빈 글과 글자 수를 검사해요. 실제 발행은 별도예요.</p><Button variant="secondary" disabled={!threadReady||completed.includes('thread')} onClick={confirmThread}>{completed.includes('thread')?'스레드 확인 완료':'스레드 완성 확인'}</Button></div>}
 {stale&&<p role="alert" className="text-sm text-amber-800">다른 탭에서 저장 내용이 변경됐어요. 제작 결과를 다시 불러와 주세요.</p>}
 {error&&<p role="alert" className="text-sm text-rose-700">{error}</p>}
 {graphic&&<div className="flex flex-col items-center text-center gap-2 rounded-2xl bg-slate-50 p-4" data-testid="verified-completion"><MotionGraphic key={graphic.name+':'+graphic.formats.join(',')+':'+(video?.artifactId??'')} name={graphic.name} formats={graphic.formats} size={280} play="once" replayKey={replay}/><h3 className="text-xl font-bold">{motionLabels[graphic.name]}</h3><p className="text-xs text-slate-600">제작 결과 확인 완료 · 외부 채널 발행을 의미하지 않아요.</p><Button variant="ghost" onClick={()=>setReplay(n=>n+1)}>모션 다시 재생</Button></div>}
 </Card></div>;
}
