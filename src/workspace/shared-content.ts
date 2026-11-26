import {z} from 'zod';
import {NarrationSourceSchema,type NarrationSource} from '../core/content-source';
import {CreativeBriefSchema,emptyBrief} from '../core/creative-brief';
import {Caption,Scene,ThemeSchema,ProjectSchema,type Project} from '../core/project';
import {effectiveTheme} from '../core/styles';
import {brandKitSchema,defaultBrandKit,contrastRatio,type BrandKit} from './brand-kit';
import {contentPlanSchema,type ContentPlan} from './content-plan';
export const sharedContentKey='shorts-studio.shared-content.v1';
const manualSource=NarrationSourceSchema.extend({kind:z.literal('manual')}).strict();
const videoSource=NarrationSourceSchema.extend({kind:z.literal('video'),projectId:z.string().regex(/^[a-zA-Z0-9-]{1,64}$/),revision:z.number().int().nonnegative(),brief:CreativeBriefSchema,theme:ThemeSchema,durationMs:z.number().int().min(1000).max(180000),captions:z.array(Caption).min(1).max(1000),scenes:z.array(Scene).min(1).max(300)}).strict();
export const sharedSourceSchema=z.discriminatedUnion('kind',[manualSource,videoSource]);
export type SharedSource=z.infer<typeof sharedSourceSchema>;
export const sharedContentSchema=z.object({version:z.literal(1),id:z.string().uuid(),plan:contentPlanSchema,brand:brandKitSchema,source:sharedSourceSchema.nullable(),progress:z.object({card:z.enum(['saved','skipped']).optional(),thread:z.enum(['saved','skipped']).optional()}).strict().optional()}).strict();
export type SharedContent=z.infer<typeof sharedContentSchema>;
export function newSharedContent(id:string,plan:ContentPlan,brand:BrandKit,narration?:NarrationSource):SharedContent{return sharedContentSchema.parse({version:1,id,plan,brand,source:narration?{kind:'manual',...narration}:null});}
export function captureVideoSource(record:SharedContent,project:Project):SharedContent{
 if(record.source?.kind==='video')throw Error('이미 저장한 공통 영상 원본을 유지했어요. 새 원본은 새 제작 계획으로 만들어 주세요.');
 const p=ProjectSchema.parse(project);
 if(p.id==='demo'||!p.audio||!p.scenes.length||!p.captions.length)throw Error('원본 영상에 음성, 자막, 장면이 필요해요.');
 // Save the exact source revision, not an editable alias or a generated file claim.
 const source=videoSource.parse({kind:'video',title:p.title,script:p.script,projectId:p.id,revision:p.revision,brief:p.creativeBrief??emptyBrief,theme:effectiveTheme(p),durationMs:p.durationMs,captions:p.captions,scenes:p.scenes});
 if(record.source?.kind==='manual'&&(record.source.title!==source.title||record.source.script!==source.script))throw Error('공통 원고와 영상의 대본이 달라 기존 원고를 유지했어요.');
 return sharedContentSchema.parse({...record,source});
}
export function sharedCardBrand(record:SharedContent):BrandKit{
 const t=record.source?.kind==='video'?record.source.theme:null;
 // The video renderer has one accent; map it to both card accents without inventing a second color.
 return brandKitSchema.parse(t?{...record.brand,background:t.background,foreground:t.foreground,primary:t.accent,accent:t.accent}:record.brand);
}
export function sharedVideoPalette(record:SharedContent):Project['theme']|undefined{
 if(JSON.stringify(record.brand)===JSON.stringify(defaultBrandKit))return undefined;
 const {background,foreground,accent}=record.brand;
 return contrastRatio(background,foreground)>=4.5&&contrastRatio(background,accent)>=4.5?{background,foreground,accent}:undefined;
}
export type SharedSnapshot={raw:string|null;record:SharedContent|null;error:string};
export function readSharedContent(storage:Pick<Storage,'getItem'>):SharedSnapshot{
 let raw:string|null=null;try{raw=storage.getItem(sharedContentKey);return {raw,record:raw===null?null:sharedContentSchema.parse(JSON.parse(raw)),error:''};}
 catch{return {raw,record:null,error:'저장된 공통 제작 원본을 읽지 못했어요. 기존 데이터를 보호하기 위해 덮어쓰지 않아요.'};}
}
export function persistSharedContent(storage:Pick<Storage,'getItem'|'setItem'>,snapshot:SharedSnapshot,record:SharedContent):SharedSnapshot{
 if(snapshot.error)throw Error(snapshot.error);
 if(storage.getItem(sharedContentKey)!==snapshot.raw)throw Error('다른 탭에서 공통 제작 원본을 변경했어요. 새로 불러온 뒤 진행해 주세요.');
 const value=sharedContentSchema.parse(record),raw=JSON.stringify(value);storage.setItem(sharedContentKey,raw);return {raw,record:value,error:''};
}
