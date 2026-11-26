import {z} from 'zod';
import type {LayoutEvidence} from './layout';
import type {ReadabilityEvidence} from './readability';
const Frame=z.number().int().nonnegative();
export const SceneCandidate=z.object({frame:Frame,code:z.enum(['unsafe','clipped','overlap','low_contrast','small_text']),roles:z.array(z.string()),value:z.number().finite().optional()});
export const SceneSummary=z.object({sceneId:z.string(),startFrame:Frame,endFrame:Frame,expectedFrames:z.array(Frame),availableFrames:z.array(Frame),missingFrames:z.array(Frame),contrastUnknown:z.number().int().nonnegative(),sizeUnknown:z.number().int().nonnegative(),candidates:z.array(SceneCandidate),status:z.enum(['candidate','incomplete','no_candidate_in_sample'])});
export const SceneEvidence=z.object({version:z.literal(1),fps:z.number().positive(),scenes:z.array(SceneSummary),unassignedFrames:z.array(Frame)});
export type SceneEvidence=z.infer<typeof SceneEvidence>;
export type SceneSummary=z.infer<typeof SceneSummary>;
type Interval={startMs:number;endMs:number};
type Source={durationMs:number;scenes:(Interval&{id:string})[];captions:Interval[]};
const unique=(a:number[])=>[...new Set(a)].sort((x,y)=>x-y);
export function plannedFrames(p:Source,fps:number){
 const total=Math.ceil(p.durationMs*fps/1000);
 if(total<1)return [];
 const clamp=(n:number)=>Math.max(0,Math.min(total-1,n));
 const frame=(ms:number)=>Math.ceil(ms*fps/1000);
 return unique([0,total-1,...p.scenes.flatMap(s=>{const a=frame(s.startMs),b=frame(s.endMs);return [a,Math.floor((a+b-1)/2),b-1];}),...p.captions.flatMap(c=>{const a=frame(c.startMs),b=frame(c.endMs);return b>a?[a,Math.floor((a+b-1)/2)]:[];})].map(clamp));
}
export function summarizeScenes(p:Source,fps:number,actual:number[],layout?:LayoutEvidence,readability?:ReadabilityEvidence):SceneEvidence{
 const planned=plannedFrames(p,fps),present=new Set(actual),sampled=new Set(layout?.sampled??[]),missing=new Set([...(layout?.missing??[]),...(readability?.missingFrames??[])]);
 const assigned=new Set<number>();
 const scenes=p.scenes.map(s=>{
  const startFrame=Math.ceil(s.startMs*fps/1000),endFrame=Math.ceil(s.endMs*fps/1000),inside=(f:number)=>f>=startFrame&&f<endFrame;
  const expectedFrames=planned.filter(inside);
  const frames=unique([...expectedFrames,...actual.filter(inside)]);for(const f of frames)assigned.add(f);
  const availableFrames=frames.filter(f=>present.has(f)&&sampled.has(f)&&!missing.has(f));
  const available=new Set(availableFrames);
  const missingFrames=frames.filter(f=>!available.has(f));
  const items=(readability?.items??[]).filter(i=>available.has(i.frame));
  const contrastUnknown=items.filter(i=>i.contrast===null).length,sizeUnknown=items.filter(i=>i.mobilePx===null).length;
  const candidates:SceneSummary['candidates']=[];
  for(const f of layout?.findings??[]){if(inside(f.frame)&&present.has(f.frame)&&sampled.has(f.frame)&&f.code!=='missing')candidates.push({frame:f.frame,code:f.code,roles:f.roles});}
  for(const i of items){if(i.contrast!==null&&i.contrast<4.5)candidates.push({frame:i.frame,code:'low_contrast',roles:[i.role],value:i.contrast});if(i.mobilePx!==null&&i.mobilePx<12)candidates.push({frame:i.frame,code:'small_text',roles:[i.role],value:i.mobilePx});}
  const noTextEvidence=availableFrames.some(f=>!items.some(i=>i.frame===f));
  return {sceneId:s.id,startFrame,endFrame,expectedFrames,availableFrames,missingFrames,contrastUnknown,sizeUnknown,candidates,status:candidates.length?'candidate' as const:!availableFrames.length||missingFrames.length||contrastUnknown||sizeUnknown||noTextEvidence?'incomplete' as const:'no_candidate_in_sample' as const};
 });
 return {version:1,fps,scenes,unassignedFrames:unique(actual.filter(f=>!assigned.has(f)))};
}
