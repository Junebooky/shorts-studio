import {z} from 'zod';
export const AssetRole=z.enum(['production','reference']);
export const AssetKind=z.enum(['image','video','audio']);
export const AssetSchema=z.object({id:z.string().uuid(),path:z.string().regex(/^workspace\/[a-zA-Z0-9-]+\/assets\/[a-zA-Z0-9-]+\.(png|jpg|webp|mp4|wav|mp3)$/),name:z.string().trim().min(1).max(150),kind:AssetKind,role:AssetRole,bytes:z.number().int().positive().max(50*1024*1024),sha256:z.string().regex(/^[a-f0-9]{64}$/),durationMs:z.number().int().positive().max(3600000).optional(),notes:z.string().max(2000).default('')});
export type Asset=z.infer<typeof AssetSchema>;
export const MediaPlacement=z.object({assetId:z.string().uuid(),fit:z.enum(['contain','cover']).default('contain'),offsetMs:z.number().int().nonnegative().default(0)}).strict();
export type MediaPlacement=z.infer<typeof MediaPlacement>;
export const MusicPlacement=z.object({assetId:z.string().uuid(),startMs:z.number().int().nonnegative(),endMs:z.number().int().positive(),offsetMs:z.number().int().nonnegative().default(0),volume:z.number().min(0).max(.3).default(.12)}).strict();
export type MusicPlacement=z.infer<typeof MusicPlacement>;
export function assetErrors(p:{id:string;assets?:Asset[];scenes:{id:string;startMs:number;endMs:number;media?:MediaPlacement}[];music?:MusicPlacement;durationMs:number}){
 const errors:string[]=[],map=new Map<string,Asset>();let bytes=0;
 for(const a of p.assets??[]){if(map.has(a.id))errors.push('소재 ID 중복');map.set(a.id,a);bytes+=a.bytes;const ext=a.path.split('.').pop();const kind=ext==='mp4'?'video':ext==='wav'||ext==='mp3'?'audio':'image';if(a.path!=='workspace/'+p.id+'/assets/'+a.id+'.'+ext||kind!==a.kind)errors.push('소재 경로/형식 오류: '+a.name);if(a.kind!=='image'&&!a.durationMs)errors.push('소재 길이 누락: '+a.name);if(a.kind==='image'&&a.durationMs!==undefined)errors.push('이미지 소재 길이 오류: '+a.name);}
 if(map.size>100)errors.push('프로젝트 소재 100개 초과');
 if(bytes>200*1024*1024)errors.push('프로젝트 소재 총 용량 200MB 초과');
 for(const s of p.scenes){if(!s.media)continue;const a=map.get(s.media.assetId);if(!a||a.role!=='production'||a.kind==='audio'){errors.push('사용할 수 없는 장면 소재: '+s.id);continue;}if(a.kind==='image'&&s.media.offsetMs!==0)errors.push('이미지 시작 시간 오류: '+s.id);if(a.kind==='video'&&s.media.offsetMs+s.endMs-s.startMs>(a.durationMs??0))errors.push('장면보다 짧은 영상 소재: '+s.id);}
 if(p.music){const m=p.music,a=map.get(m.assetId);if(!a||a.kind!=='audio'||a.role!=='production'||m.endMs<=m.startMs||m.endMs>p.durationMs||m.offsetMs+m.endMs-m.startMs>(a?.durationMs??0))errors.push('음악 소재 또는 배치 시간 오류');}
 return errors;
}

// Pure usage summary: a reference is never implicitly promoted by a preview or filter.
export function assetUsage(p:{scenes:{id:string;media?:MediaPlacement}[];music?:MusicPlacement},assetId:string){
 const sceneIds=p.scenes.filter(s=>s.media?.assetId===assetId).map(s=>s.id);
 const music=p.music?.assetId===assetId;
 return {sceneIds,music,used:sceneIds.length>0||music};
}
export function assetLibrarySummary(assets:readonly Asset[]){
 return {count:assets.length,bytes:assets.reduce((sum,a)=>sum+a.bytes,0),production:assets.filter(a=>a.role==='production').length,reference:assets.filter(a=>a.role==='reference').length};
}
