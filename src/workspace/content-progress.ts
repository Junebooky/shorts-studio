import {contentFormats,type ContentFormat} from './content-plan';
import type {SharedContent} from './shared-content';
import type {CardDeck} from './card-news';
import type {ThreadDeck} from './thread-news';
import {threadReady} from './thread-news';
import {isSourceDeck} from './video-to-card';
export type Derivative='card'|'thread';
export type Outcome='saved'|'skipped';
export function cardMatches(deck:CardDeck,record:SharedContent){return record.source?.kind==='video'?isSourceDeck(deck,record):deck.planId===record.id;}
export function threadMatches(deck:ThreadDeck,record:SharedContent){const s=deck.source;return !!s&&s.planId===record.id&&(record.source?.kind==='video'?s.kind==='video'&&s.projectId===record.source.projectId&&s.revision===record.source.revision:s.kind===(record.source?.kind==='manual'?'manual':'topic'));}
export function formatOutcome(record:SharedContent,format:ContentFormat):Outcome|undefined{return format==='video'?(record.source?.kind==='video'?'saved':undefined):record.progress?.[format];}
export function nextContentFormat(record:SharedContent):ContentFormat|null{return contentFormats.find(f=>record.plan.formats.includes(f)&&!formatOutcome(record,f))??null;}
export function finishContent(record:SharedContent,format:Derivative,outcome:Outcome):SharedContent{
 if(nextContentFormat(record)!==format)throw Error('현재 제작 단계부터 완료해 주세요.');
 return {...record,progress:{...record.progress,[format]:outcome}};
}
export function canSkipFormat(record:SharedContent,format:ContentFormat|null):format is Derivative{return !!format&&format!=='video'&&record.plan.formats.length>1&&nextContentFormat(record)===format&&contentFormats.some(f=>record.plan.formats.includes(f)&&!!formatOutcome(record,f));}
export function recoverSavedProgress(record:SharedContent,card:CardDeck|null,thread:ThreadDeck|null):SharedContent{
 let next=record;
 if(nextContentFormat(next)==='card'&&card&&cardMatches(card,next))next=finishContent(next,'card','saved');
 if(nextContentFormat(next)==='thread'&&thread&&threadMatches(thread,next)&&threadReady(thread))next=finishContent(next,'thread','saved');
 return next;
}
