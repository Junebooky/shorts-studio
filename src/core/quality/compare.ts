import {z} from 'zod';
import {QualityReport} from '../quality';
import type {LayoutFinding} from './layout';
export const QualitySnapshot=z.object({version:z.literal(1),projectId:z.string().regex(/^[a-zA-Z0-9-]{1,64}$/),revision:z.number().int().nonnegative(),runId:z.string().min(1).max(128),report:QualityReport});
export type QualitySnapshot=z.infer<typeof QualitySnapshot>;
const key=(f:LayoutFinding)=>JSON.stringify([f.frame,f.code,[...f.roles].sort()]);
function usable(s:QualitySnapshot){const l=s.report.layout;if(!l)return new Set<number>();const missing=new Set(l.missing);return new Set(l.sampled.filter(f=>s.report.frames.includes(f)&&!missing.has(f)));}
export function compareQuality(before:QualitySnapshot,after:QualitySnapshot){
 if(before.projectId!==after.projectId||before.report.mode!==after.report.mode)throw new Error('같은 프로젝트와 출력 종류의 검수 기록이 필요해요.');
 if(before.runId===after.runId)throw new Error('서로 다른 검수 실행을 선택해 주세요.');
 const old=usable(before),now=usable(after);
 const common=[...old].filter(f=>now.has(f)).sort((a,b)=>a-b),comparable=new Set(common);
 const beforeOnly=[...old].filter(f=>!now.has(f)).sort((a,b)=>a-b),afterOnly=[...now].filter(f=>!old.has(f)).sort((a,b)=>a-b);
 const unavailable=[...new Set([...before.report.frames,...after.report.frames])].filter(f=>!comparable.has(f)).sort((a,b)=>a-b);
 const group=(s:QualitySnapshot)=>{const map=new Map<string,LayoutFinding[]>();for(const f of s.report.layout?.findings??[]){if(!comparable.has(f.frame)||f.code==='missing')continue;const k=key(f);map.set(k,[...(map.get(k)??[]),f]);}return map;};
 const a=group(before),b=group(after),removed:LayoutFinding[]=[],added:LayoutFinding[]=[],remaining:LayoutFinding[]=[];
 for(const k of new Set([...a.keys(),...b.keys()])){const x=a.get(k)??[],y=b.get(k)??[],n=Math.min(x.length,y.length);remaining.push(...y.slice(0,n));removed.push(...x.slice(n));added.push(...y.slice(n));}
 const checks=after.report.checks.flatMap(c=>{const prev=before.report.checks.find(x=>x.id===c.id);return prev&&prev.status!==c.status?[{id:c.id,name:c.name,before:prev.status,after:c.status}]:[];});
 return {common,beforeOnly,afterOnly,unavailable,removed,added,remaining,checks,comparable:common.length>0};
}
