import type {SharedContent} from './shared-content';
import type {CardDeck} from './card-news';
import {isSourceDeck} from './video-to-card';
import {threadReady,type ThreadDeck} from './thread-news';
import {contentFormats,type ContentFormat} from './content-plan';
export type ResultItem={format:ContentFormat;state:'not-started'|'editing'|'saved'|'source'|'unavailable';detail:string;linked:boolean;ready:boolean};
export function cardLinked(deck:CardDeck,record:SharedContent){return record.source?.kind==='video'?isSourceDeck(deck,record):!deck.source&&deck.planId===record.id;}
export function threadLinked(deck:ThreadDeck,record:SharedContent){const s=deck.source;return !!s&&s.planId===record.id&&(record.source?.kind==='video'?s.kind==='video'&&s.projectId===record.source.projectId&&s.revision===record.source.revision:s.kind===(record.source?.kind==='manual'?'manual':'topic'));}
export function summarizeResults(record:SharedContent,card:{draft:CardDeck;dirty:boolean;stored:boolean;error:string},thread:{draft:ThreadDeck;dirty:boolean;stored:boolean;error:string}):ResultItem[]{
 const source=record.source;
 const video=source?.kind==='video';
 const c=cardLinked(card.draft,record),t=threadLinked(thread.draft,record);
 const cSaved=c&&card.stored&&!card.dirty&&!card.error,tSaved=t&&thread.stored&&!thread.dirty&&!thread.error;
 const cardContent=card.draft.pages.every(p=>!!p.title.trim()),threadContent=threadReady(thread.draft);
 return [
 {format:'video',state:video?'source':'not-started',detail:video?'원본 영상 리비전 '+source.revision+' · 실제 검수 상태는 서버에서 확인해요.':'아직 연결된 영상 원본이 없어요.',linked:video,ready:video},
 {format:'card',state:card.error?'unavailable':!c?'not-started':cSaved?'saved':'editing',detail:c?card.draft.pages.length+'장 · '+(cardContent?'페이지별 화면 검수 필요':'제목이 비어 있는 페이지가 있어요.'):card.error?'카드뉴스 저장 상태를 확인해 주세요.':'현재 계획에 연결된 카드뉴스가 없어요.',linked:c,ready:cSaved&&cardContent},
 {format:'thread',state:thread.error?'unavailable':!t?'not-started':tSaved?'saved':'editing',detail:t?thread.draft.posts.length+'개 게시글 · '+(threadContent?'글자 수 검사 통과':'내용 또는 글자 수 확인 필요'):thread.error?'스레드 저장 상태를 확인해 주세요.':'현재 계획에 연결된 스레드가 없어요.',linked:t,ready:tSaved&&threadContent}
 ];
}
export function resultQueue(record:SharedContent,items:ResultItem[]){
 const selected=contentFormats.filter(f=>record.plan.formats.includes(f));
 const skipped=selected.filter(f=>f!=='video'&&record.skippedFormats?.includes(f));
 const pending=selected.find(f=>!skipped.includes(f)&&!items.find(i=>i.format===f)?.ready);
 return {selected,pending,skipped,suggestions:[] as ContentFormat[]};
}

export function canSkipNext(record:SharedContent,items:ResultItem[]){const q=resultQueue(record,items);return q.pending!==undefined&&q.pending!=='video'&&q.selected.length>1&&q.selected.some(f=>q.skipped.includes(f)||items.some(i=>i.format===f&&i.ready));}
export function skipNext(record:SharedContent,items:ResultItem[]):SharedContent{const q=resultQueue(record,items);if(!canSkipNext(record,items)||!q.pending||q.pending==='video')throw Error('현재 단계는 건너뛸 수 없어요.');return {...record,skippedFormats:[...new Set([...(record.skippedFormats??[]),q.pending])]};}
