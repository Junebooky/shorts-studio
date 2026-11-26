import {z} from 'zod';
export const Rect=z.object({left:z.number().finite(),top:z.number().finite(),right:z.number().finite(),bottom:z.number().finite()}).refine(r=>r.right>r.left&&r.bottom>r.top);
export const LayoutSample=z.object({frame:z.number().int().nonnegative(),elements:z.array(z.object({role:z.string().min(1).max(40),rects:z.array(Rect).max(250),clip:Rect.nullable()})).max(100)});
export type LayoutSample=z.infer<typeof LayoutSample>;
export type Rect=z.infer<typeof Rect>;
export const LayoutFinding=z.object({code:z.enum(['unsafe','clipped','overlap','missing']),frame:z.number().int().nonnegative(),roles:z.array(z.string()),rect:Rect.optional()});
export type LayoutFinding=z.infer<typeof LayoutFinding>;
const outside=(r:Rect,b:Rect)=>r.left<b.left-2||r.top<b.top-2||r.right>b.right+2||r.bottom>b.bottom+2;
const intersect=(a:Rect,b:Rect):Rect|undefined=>{const r={left:Math.max(a.left,b.left),top:Math.max(a.top,b.top),right:Math.min(a.right,b.right),bottom:Math.min(a.bottom,b.bottom)};return r.right-r.left>2&&r.bottom-r.top>2?r:undefined;};
export function inspectLayout(sample:LayoutSample,safe:Rect,canvas:Rect,expected:string[]):LayoutFinding[]{
 const findings:LayoutFinding[]=[];
 const add=(code:LayoutFinding['code'],roles:string[],rect?:Rect)=>findings.push({code,frame:sample.frame,roles,...(rect?{rect}:{})});
 for(const role of expected)if(!sample.elements.some(e=>e.role===role&&e.rects.length))add('missing',[role]);
 for(const [i,e] of sample.elements.entries()){
  const unsafe=e.rects.find(r=>outside(r,safe));if(unsafe)add('unsafe',[e.role],unsafe);
  const clipped=e.rects.find(r=>outside(r,canvas)||(e.clip!==null&&outside(r,e.clip)));if(clipped)add('clipped',[e.role],clipped);
  for(const other of sample.elements.slice(i+1)){
   let hit:Rect|undefined;for(const a of e.rects){for(const b of other.rects){hit=intersect(a,b);if(hit)break;}if(hit)break;}
   if(hit)add('overlap',[e.role,other.role],hit);
  }
 }
 return findings;
}
export const LayoutEvidence=z.object({version:z.literal(1),sampled:z.array(z.number().int().nonnegative()),missing:z.array(z.number().int().nonnegative()),findings:z.array(LayoutFinding)});
export type LayoutEvidence=z.infer<typeof LayoutEvidence>;
