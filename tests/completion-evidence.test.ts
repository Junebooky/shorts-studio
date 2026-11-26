import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifiedFinal,matchingVideo,chooseCompletion,cardCanConfirm,threadCanConfirm,checkCardPages,type AvailableFinal} from '../src/workspace/completion-evidence';
import {newSharedContent,type SharedContent} from '../src/workspace/shared-content';
import {newCardDeck} from '../src/workspace/card-news';
import {newThread} from '../src/workspace/thread-news';
import {defaultBrandKit} from '../src/workspace/brand-kit';
const planId='00000000-0000-4000-8000-000000000001',pageId='00000000-0000-4000-8000-000000000002',run='00000000-0000-4000-8000-000000000003';
const record=newSharedContent(planId,{topic:'테스트',formats:['card','thread']},defaultBrandKit);
const card={...newCardDeck(pageId),planId,pages:[{id:pageId,layout:'cover' as const,title:'제목',body:'본문'}]};
const thread={...newThread(pageId),source:{kind:'topic' as const,planId},posts:[{id:pageId,text:'테스트 게시글'}]};
const saved=<T>(draft:T)=>({draft,stored:true,dirty:false,error:''});
test('no success on unsaved, dirty, erroneous, invalid or unrelated drafts',()=>{
 assert.equal(cardCanConfirm(record,saved(card)),true);assert.equal(threadCanConfirm(record,saved(thread)),true);
 for(const state of [{stored:false},{dirty:true},{error:'failed'}]){assert.equal(cardCanConfirm(record,{...saved(card),...state}),false);assert.equal(threadCanConfirm(record,{...saved(thread),...state}),false);}
 assert.equal(cardCanConfirm(record,saved({...card,planId:undefined})),false);
 assert.equal(threadCanConfirm(record,saved({...thread,posts:[{id:pageId,text:'x'.repeat(501)}]})),false);
});
test('all pages must render without overflow',async()=>{let count=0;await checkCardPages(card,async()=>{count++;return {overflow:false}});assert.equal(count,1);await assert.rejects(checkCardPages(card,async()=>({overflow:true})),/영역/);await assert.rejects(checkCardPages(card,async()=>{throw Error('render failed')}),/render failed/);});
test('final proof requires current review and non-fixture archived output',()=>{
 const video={...record,source:{kind:'video',projectId:'p',revision:2}} as SharedContent;
 const artifact:AvailableFinal={version:1,id:pageId,projectId:'p',revision:2,reviewRunId:run,createdAt:'2026-01-01',title:'fixture',bytes:1,sha256:'a'.repeat(64),reviewer:'user',testFixture:false,available:true};
 const e={revision:2,reviewApproved:true,finalReady:true,reviewRunId:run,finals:[artifact]};
 assert.ok(matchingVideo(video,verifiedFinal(video,e)));
 for(const patch of [{revision:3},{reviewApproved:false},{finalReady:false},{reviewRunId:undefined},{finals:[]},{finals:[{...artifact,testFixture:true}]},{finals:[{...artifact,available:false}]},{finals:[{...artifact,reviewRunId:pageId}]}])assert.equal(verifiedFinal(video,{...e,...patch}),null);
 assert.equal(verifiedFinal(record,e),null);assert.equal(matchingVideo({...video,id:pageId},verifiedFinal(video,e)),false);
});
test('only selected completed formats are celebrated; aggregate requires every selected format',()=>{
 assert.equal(chooseCompletion(['video'],['card']),null);
 assert.deepEqual(chooseCompletion(['video'],['video','card']),{name:'shorts-complete',formats:['shorts']});
 assert.deepEqual(chooseCompletion(['card','thread'],['card']),{name:'card-news-complete',formats:['card-news']});
 assert.deepEqual(chooseCompletion(['card','thread'],['video','card','thread']),{name:'all-content-complete',formats:['card-news','threads']});
 assert.equal(chooseCompletion(['video','card','thread'],['video','card'],'card')?.name,'card-news-complete');
});
