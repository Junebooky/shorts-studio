import type {FinalArtifact} from '../core/production-library';
import type {ContentFormat} from './content-plan';
import type {SharedContent} from './shared-content';
import type {CardDeck} from './card-news';
import {threadReady,type ThreadDeck} from './thread-news';
import {cardLinked} from './content-results';
import type {MotionFormat,MotionName} from '../design-system/motion-graphics/types';
export type AvailableFinal=FinalArtifact&{available:boolean};
export type VideoCompletionEvidence={revision:number;reviewApproved:boolean;finalReady:boolean;reviewRunId?:string;finals:AvailableFinal[]};
export type VideoProof={planId:string;projectId:string;revision:number;artifactId:string};
export type SavedDraft<T>={draft:T;stored:boolean;dirty:boolean;error:string};
export function verifiedFinal(record:SharedContent,evidence:VideoCompletionEvidence):VideoProof|null{
 const s=record.source;
 if(s?.kind!=='video'||!evidence.reviewApproved||!evidence.finalReady||!evidence.reviewRunId||evidence.revision!==s.revision)return null;
 const f=evidence.finals.find(f=>f.projectId===s.projectId&&f.revision===s.revision&&f.reviewRunId===evidence.reviewRunId&&f.available&&!f.testFixture);
 return f?{planId:record.id,projectId:s.projectId,revision:s.revision,artifactId:f.id}:null;
}
export function matchingVideo(record:SharedContent,proof:VideoProof|null){
 const s=record.source;return !!proof&&s?.kind==='video'&&proof.planId===record.id&&proof.projectId===s.projectId&&proof.revision===s.revision;
}
const saved=<T>(s:SavedDraft<T>)=>s.stored&&!s.dirty&&!s.error;
export function cardCanConfirm(record:SharedContent,card:SavedDraft<CardDeck>){
 return saved(card)&&cardLinked(card.draft,record)&&!!card.draft.name.trim()&&card.draft.pages.length>0&&card.draft.pages.every(p=>!!p.title.trim());
}
export function threadCanConfirm(record:SharedContent,thread:SavedDraft<ThreadDeck>){
 const s=record.source,o=thread.draft.source;
 if(!saved(thread)||!o||o.planId!==record.id||!threadReady(thread.draft))return false;
 return s?.kind==='video'?o.kind==='video'&&o.projectId===s.projectId&&o.revision===s.revision:s?.kind==='manual'?o.kind==='manual':o.kind==='topic';
}
export async function checkCardPages(deck:CardDeck,render:(page:CardDeck['pages'][number],index:number)=>Promise<{overflow:boolean}>){
 for(const [i,page] of deck.pages.entries()){
  if(!page.title.trim())throw Error((i+1)+'페이지 제목을 입력해 주세요.');
  if((await render(page,i)).overflow)throw Error((i+1)+'페이지가 이미지 영역을 넘었어요. 수정 후 다시 확인해 주세요.');
 }
}
export const formatMotion:Record<ContentFormat,MotionFormat>={video:'shorts',card:'card-news',thread:'threads'};
const names:Record<ContentFormat,MotionName>={video:'shorts-complete',card:'card-news-complete',thread:'threads-complete'};
export function chooseCompletion(selected:readonly ContentFormat[],completed:readonly ContentFormat[],latest?:ContentFormat):{name:MotionName;formats:MotionFormat[]}|null{
 const ready=selected.filter(f=>completed.includes(f));
 if(!ready.length)return null;
 if(selected.length>1&&ready.length===selected.length)return {name:'all-content-complete',formats:ready.map(f=>formatMotion[f])};
 const f=latest&&ready.includes(latest)?latest:ready[ready.length-1];
 return {name:names[f],formats:[formatMotion[f]]};
}
