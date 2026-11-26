import {test} from 'node:test';import assert from 'node:assert/strict';
import {campaignStorageKey,parseCampaignStore,saveCampaign,selectCampaign,removeCampaign,readCampaignSnapshot,persistCampaignStore,emptyCampaignBrief} from '../src/workspace/campaigns';
const id='00000000-0000-4000-8000-000000000001',second='00000000-0000-4000-8000-000000000002',at='2026-01-01T00:00:00.000Z';
const brief={...emptyCampaignBrief,name:'테스트 캠페인',goal:'인지도',audience:'초보자',message:'핵심 메시지'};
test('campaign create, edit, selection, removal and round trip',()=>{
 const empty=parseCampaignStore(null),first=saveCampaign(empty,brief,id,at);
 assert.equal(first.activeId,id);assert.equal(empty.campaigns.length,0);
 const other=saveCampaign(first,{...brief,name:'다른 캠페인'},second,at);
 const edited=saveCampaign(other,{...brief,name:'수정'},id,at);
 assert.equal(edited.campaigns.length,2);assert.equal(edited.campaigns[0].name,'수정');
 const selected=selectCampaign(edited,second);assert.equal(selected.activeId,second);
 const removed=removeCampaign(selected,second);assert.equal(removed.activeId,null);
 assert.deepEqual(parseCampaignStore(JSON.stringify(removed)),removed);
 assert.throws(()=>saveCampaign(empty,{...brief,name:'  '},id,at));
 assert.throws(()=>selectCampaign(empty,id));
});
test('local persistence protects malformed data, other-tab changes and failed writes',()=>{
 const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v)}};
 const snapshot=readCampaignSnapshot(storage),next=saveCampaign(snapshot.store,brief,id,at),saved=persistCampaignStore(storage,snapshot,next);
 assert.deepEqual(readCampaignSnapshot(storage).store,next);
 assert.throws(()=>persistCampaignStore(storage,snapshot,next),/다른 탭/);
 assert.throws(()=>persistCampaignStore({...storage,setItem:()=>{throw new Error('quota')}},saved,next),/quota/);
 map.set(campaignStorageKey,'invalid');
 const broken=readCampaignSnapshot(storage);assert.ok(broken.error);
 assert.throws(()=>persistCampaignStore(storage,broken,next));assert.equal(map.get(campaignStorageKey),'invalid');
});
