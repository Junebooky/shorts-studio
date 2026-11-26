import {z} from 'zod';

export const campaignStorageKey='shorts-studio.marketing-campaigns.v1';
export const campaignBriefSchema=z.object({
 name:z.string().trim().min(1,'캠페인 이름을 입력해 주세요.').max(100),
 goal:z.string().trim().max(500),
 audience:z.string().trim().max(500),
 message:z.string().trim().max(1000),
}).strict();
export type CampaignBrief=z.infer<typeof campaignBriefSchema>;
export const emptyCampaignBrief:CampaignBrief={name:'',goal:'',audience:'',message:''};
const campaignSchema=campaignBriefSchema.extend({id:z.string().uuid(),updatedAt:z.string().datetime()});
export type Campaign=z.infer<typeof campaignSchema>;
const campaignStoreSchema=z.object({version:z.literal(1),activeId:z.string().uuid().nullable(),campaigns:z.array(campaignSchema).max(100)}).strict().superRefine((store,ctx)=>{
 if(new Set(store.campaigns.map(c=>c.id)).size!==store.campaigns.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'캠페인 ID가 중복됐어요.'});
 if(store.activeId!==null&&!store.campaigns.some(c=>c.id===store.activeId))ctx.addIssue({code:z.ZodIssueCode.custom,message:'선택한 캠페인을 찾을 수 없어요.'});
});
export type CampaignStore=z.infer<typeof campaignStoreSchema>;
export function parseCampaignStore(raw:string|null):CampaignStore{
 return raw===null?{version:1,activeId:null,campaigns:[]}:campaignStoreSchema.parse(JSON.parse(raw));
}
export function saveCampaign(store:CampaignStore,brief:CampaignBrief,id:string,updatedAt:string):CampaignStore{
 const campaign=campaignSchema.parse({...brief,id,updatedAt});
 return campaignStoreSchema.parse({...store,activeId:id,campaigns:[campaign,...store.campaigns.filter(c=>c.id!==id)]});
}
export function selectCampaign(store:CampaignStore,id:string|null):CampaignStore{
 return campaignStoreSchema.parse({...store,activeId:id});
}
export function removeCampaign(store:CampaignStore,id:string):CampaignStore{
 return campaignStoreSchema.parse({...store,activeId:store.activeId===id?null:store.activeId,campaigns:store.campaigns.filter(c=>c.id!==id)});
}
export type CampaignSnapshot={raw:string|null;store:CampaignStore;error:string};
export function readCampaignSnapshot(storage:Pick<Storage,'getItem'>):CampaignSnapshot{
 let raw:string|null=null;
 try{raw=storage.getItem(campaignStorageKey);return {raw,store:parseCampaignStore(raw),error:''};}
 catch{return {raw,store:parseCampaignStore(null),error:'저장된 캠페인을 읽지 못했어요. 기존 데이터를 보호하기 위해 저장하지 않아요.'};}
}
export function persistCampaignStore(storage:Pick<Storage,'getItem'|'setItem'>,snapshot:CampaignSnapshot,next:CampaignStore):CampaignSnapshot{
 if(snapshot.error)throw new Error(snapshot.error);
 if(storage.getItem(campaignStorageKey)!==snapshot.raw)throw new Error('다른 탭에서 캠페인을 바꿨어요. 다시 불러온 뒤 저장해 주세요.');
 const store=campaignStoreSchema.parse(next),raw=JSON.stringify(store);
 storage.setItem(campaignStorageKey,raw);
 return {store,raw,error:''};
}
