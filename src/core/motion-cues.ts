import {z} from 'zod';
import type {Visual} from './visual';
import type {MasterTimeline} from './timing';
import {normalizeSpeech} from './timing';
export const CueInputSchema=z.object({slot:z.number().int().min(0).max(2),wordIndex:z.number().int().nonnegative(),expectedWord:z.string().trim().min(1).max(200)}).strict();
export const CueSchema=CueInputSchema.extend({startMs:z.number().int().nonnegative(),endMs:z.number().int().positive()});
export type Cue=z.infer<typeof CueSchema>;
export function visualSlots(v:Visual){return v.type==='mechanism'?1:v.type==='semiconductor'?(v.operation==='deposition'?2:1):v.type==='focus'?1:v.type==='path'||v.type==='cycle'?3:2;}
export function resolveCues(input:z.infer<typeof CueInputSchema>[],visual:Visual,analysis:MasterTimeline|undefined,startMs:number,endMs:number){
 const seen=new Set<number>();let previous=-1;
 return input.map(c=>{if(!analysis||c.slot>=visualSlots(visual)||seen.has(c.slot)||c.slot<=previous)throw new Error('유효하지 않은 그래픽 슬롯 또는 순서');seen.add(c.slot);previous=c.slot;const w=analysis.words[c.wordIndex];if(!w||normalizeSpeech(w.text)!==normalizeSpeech(c.expectedWord)||w.startMs<startMs||w.endMs>endMs)throw new Error('어절 타이밍 근거 오류: '+c.expectedWord);if(w.confidence!==undefined&&w.confidence<.5)throw new Error('낮은 신뢰도 어절로 그래픽 동기화 불가');return CueSchema.parse({...c,startMs:w.startMs,endMs:w.endMs});});
}
export function cueFrame(cue:Cue,sceneStartMs:number,fps:number){return Math.max(0,Math.ceil(cue.startMs*fps/1000)-Math.ceil(sceneStartMs*fps/1000));}
