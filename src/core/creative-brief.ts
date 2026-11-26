import {z} from 'zod';
const field=(max:number)=>z.string().trim().max(max).default('');
export const CreativeBriefSchema=z.object({purpose:field(240),audience:field(120),takeaway:field(240),tone:field(120),mustInclude:field(800),avoid:field(800)}).strict();
export type CreativeBrief=z.infer<typeof CreativeBriefSchema>;
export const emptyBrief:CreativeBrief=CreativeBriefSchema.parse({});
export function briefKey(brief?:CreativeBrief){const b=CreativeBriefSchema.parse(brief??{});return Object.values(b).some(Boolean)?JSON.stringify(b):'';}
export const CreativePlanSchema=z.object({message:z.string().trim().min(1).max(240),narrative:z.string().trim().min(1).max(600),visualApproach:z.string().trim().min(1).max(600),constraints:z.string().trim().min(1).max(800),referenceDecisions:z.array(z.object({assetId:z.string().uuid(),decision:z.enum(['reviewed','not_used']),notes:z.string().trim().min(1).max(600)}).strict()).max(100).default([])}).strict();
export type CreativePlan=z.infer<typeof CreativePlanSchema>;
export function checkPlan(plan:CreativePlan|undefined,brief?:CreativeBrief,referenceIds:string[]=[]){if(briefKey(brief)&&!plan)throw new Error('사용자 제작 브리프에 대한 AI 연출 계획이 필요합니다.');if(!plan)return;const ids=plan.referenceDecisions.map(x=>x.assetId);if(new Set(ids).size!==ids.length||ids.some(id=>!referenceIds.includes(id)))throw new Error('연출 계획의 레퍼런스 ID 오류');if(briefKey(brief)&&referenceIds.some(id=>!ids.includes(id)))throw new Error('참고용 자료별 검토 또는 미사용 이유를 기록하세요.');}
export function briefCurrent(p:{creativeBrief?:CreativeBrief;direction?:{briefKey?:string;plan?:CreativePlan};assets?:{id:string;role:string}[]}){try{const key=briefKey(p.creativeBrief);if(key&&p.direction?.briefKey!==key)return false;if(!key&&p.direction?.briefKey)return false;checkPlan(p.direction?.plan,p.creativeBrief,(p.assets??[]).filter(a=>a.role==='reference').map(a=>a.id));return true;}catch{return false;}}
