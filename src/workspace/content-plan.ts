import {z} from 'zod';
import type {Project} from '../core/project';
import type {NarrationSource} from '../core/content-source';
export const contentFormats=['video','card','thread'] as const;
export type ContentFormat=typeof contentFormats[number];
export const formatLabels:Record<ContentFormat,string>={video:'숏츠 영상',card:'카드뉴스',thread:'스레드'};
export const contentPlanSchema=z.object({topic:z.string().trim().min(1).max(500),formats:z.array(z.enum(contentFormats)).min(1).max(3)}).strict().superRefine((p,ctx)=>{if(new Set(p.formats).size!==p.formats.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'중복된 콘텐츠 형식이에요.'});});
export type ContentPlan=z.infer<typeof contentPlanSchema>;
export type VideoLaunch={id:string;topic:string;sourceScript?:NarrationSource;brandPalette?:Project['theme'];projectId?:string};
export function toggleFormat(formats:readonly ContentFormat[],id:ContentFormat):ContentFormat[]{return contentFormats.filter(f=>f===id?!formats.includes(f):formats.includes(f));}
export function createContentPlan(topic:string,formats:readonly ContentFormat[]):ContentPlan{
 const p=contentPlanSchema.parse({topic,formats:[...formats]});
 return {...p,formats:contentFormats.filter(f=>p.formats.includes(f))};
}
export function firstAvailableFormat(plan:ContentPlan):ContentFormat|null{return plan.formats.find(f=>f!=='thread')??null;}
export function cardTopicFields(topic:string){const value=z.string().trim().min(1).max(500).parse(topic);return {name:value.length<=100?value:'새 카드뉴스',title:value.length<=100?value:'',body:value.length<=100?'':value};}
