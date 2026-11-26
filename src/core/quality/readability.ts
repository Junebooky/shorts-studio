import {z} from 'zod';
const RGB=z.tuple([z.number().int().min(0).max(255),z.number().int().min(0).max(255),z.number().int().min(0).max(255)]);
export type RGB=z.infer<typeof RGB>;
export const TextAppearance=z.object({
 fontPx:z.number().finite().positive().max(10000).nullable(),
 foreground:RGB.nullable(),background:RGB.nullable(),
 reason:z.enum(['solid','transparent','complex','mixed','unknown'])
});
export type TextAppearance=z.infer<typeof TextAppearance>;
export const ReadabilityItem=z.object({frame:z.number().int().nonnegative(),role:z.string(),contrast:z.number().min(1).max(21).nullable(),mobilePx:z.number().positive().nullable(),reason:TextAppearance.shape.reason});
export type ReadabilityItem=z.infer<typeof ReadabilityItem>;
export const ReadabilityEvidence=z.object({version:z.literal(1),items:z.array(ReadabilityItem),missingFrames:z.array(z.number().int().nonnegative()),contrastThreshold:z.literal(4.5),mobileWidth:z.literal(360),minMobilePx:z.literal(12)});
export type ReadabilityEvidence=z.infer<typeof ReadabilityEvidence>;
const lum=(rgb:RGB)=>rgb.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
export function contrastRatio(a:RGB,b:RGB){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function opaqueRgb(css:string):RGB|null{
 const m=/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(1(?:\.0+)?))?\s*\)$/.exec(css);
 if(!m)return null;const p=RGB.safeParse(m.slice(1,4).map(Number));return p.success?p.data:null;
}
export function measureReadability(frame:number,role:string,appearance?:TextAppearance):ReadabilityItem{
 const solid=appearance?.reason==='solid'&&appearance.foreground&&appearance.background;
 return {frame,role,contrast:solid?contrastRatio(appearance.foreground!,appearance.background!):null,mobilePx:appearance?.fontPx?appearance.fontPx/3:null,reason:appearance?.reason??'unknown'};
}
export function readabilityStatus(e:ReadabilityEvidence,kind:'contrast'|'size'){
 const threshold=kind==='contrast'?e.contrastThreshold:e.minMobilePx;
 const get=(i:ReadabilityItem)=>kind==='contrast'?i.contrast:i.mobilePx;
 const measured=e.items.filter(i=>get(i)!==null);
 const candidates=measured.filter(i=>get(i)!<threshold);
 const unknown=e.items.length-measured.length;
 return {measured:measured.length,unknown,candidates,status:(candidates.length?'fail':unknown||e.missingFrames.length||!measured.length?'not_checked':'pass') as 'pass'|'fail'|'not_checked'};
}
