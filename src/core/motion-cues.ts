import {z} from 'zod';
import type {Visual} from './visual';
import type {MasterTimeline} from './timing';
import {normalizeSpeech} from './timing';
export const CueInputSchema=z.object({slot:z.number().int().min(0).max(2),wordIndex:z.number().int().nonnegative(),expectedWord:z.string().trim().min(1).max(200)}).strict();
export const CueSchema=CueInputSchema.extend({startMs:z.number().int().nonnegative(),endMs:z.number().int().positive()});
export type Cue=z.infer<typeof CueSchema>;
export function visualSlots(v:Visual){return v.type==='focus'?1:v.type==='path'||v.type==='cycle'?3:2;}
// Match the current composition's 30 FPS contract. The compiler may pass a different
// explicit FPS if the shared composition contract changes later.
export const CUE_DEFAULT_FPS=30;
type Word=MasterTimeline['words'][number];
type Segment=MasterTimeline['segments'][number];
const sameWord=(a:Word,b:Word)=>a.text===b.text&&a.startMs===b.startMs&&a.endMs===b.endMs&&a.confidence===b.confidence;
const frameAt=(ms:number,fps:number)=>Math.ceil(ms*fps/1000);

function evidenceIndex(a:MasterTimeline){
 const indexed:{word:Word;segment:Segment}[]=[];
 let end=0;
 for(const segment of a.segments){
  if(!Number.isInteger(segment.startMs)||!Number.isInteger(segment.endMs)||segment.startMs<end||segment.endMs<=segment.startMs||segment.endMs>a.durationMs)throw new Error('발화 구간 타이밍 근거 오류');
  let previous=segment.startMs;
  for(const word of segment.words){
   if(!Number.isInteger(word.startMs)||!Number.isInteger(word.endMs)||word.startMs<previous||word.endMs<=word.startMs||word.endMs>segment.endMs)throw new Error('어절 타이밍 근거 오류: '+word.text);
   indexed.push({word,segment});previous=word.endMs;
  }
  end=segment.endMs;
 }
 if(indexed.length!==a.words.length||indexed.some((entry,i)=>!sameWord(entry.word,a.words[i])))throw new Error('발화 구간과 전체 어절 근거가 일치하지 않습니다.');
 return indexed;
}
export function resolveCues(input:z.infer<typeof CueInputSchema>[],visual:Visual,analysis:MasterTimeline|undefined,startMs:number,endMs:number,fps=CUE_DEFAULT_FPS){
 const parsed=z.array(CueInputSchema).max(3).parse(input);
 if(!parsed.length)return [];
 if(!analysis||!analysis.sourceAudio||!analysis.sourceScript.trim())throw new Error('원본 음성 및 어절 타이밍 근거 필요');
 if(!Number.isInteger(startMs)||!Number.isInteger(endMs)||startMs<0||endMs<=startMs||endMs>analysis.durationMs||!Number.isFinite(fps)||fps<=0||frameAt(endMs,fps)<=frameAt(startMs,fps))throw new Error('유효하지 않은 장면 또는 프레임 범위');
 const indexed=evidenceIndex(analysis);
 const seen=new Set<number>();let previous=-1;
 return parsed.map(c=>{
  if(c.slot>=visualSlots(visual)||seen.has(c.slot)||c.slot<=previous)throw new Error('유효하지 않은 그래픽 슬롯 또는 순서');
  seen.add(c.slot);previous=c.slot;
  const item=indexed[c.wordIndex],token=normalizeSpeech(c.expectedWord);
  if(!item||!token||normalizeSpeech(item.word.text)!==token||item.word.startMs<startMs||item.word.endMs>endMs)throw new Error('어절 타이밍 근거 오류: '+c.expectedWord);
  const {word:w,segment:s}=item;
  if(!normalizeSpeech(s.text)||normalizeSpeech(s.words.map(w=>w.text).join(''))!==normalizeSpeech(s.text))throw new Error('발화 구간과 어절 텍스트 근거 불일치: '+c.expectedWord);
  if(w.confidence!==undefined&&(!Number.isFinite(w.confidence)||w.confidence<.5||w.confidence>1))throw new Error('낮은 신뢰도 또는 잘못된 신뢰도 어절로 그래픽 동기화 불가');
  // Do not claim a cue is speech-synced if no displayed frame exists inside
  // the word interval. No clamping to an earlier frame or invented time.
  if(frameAt(w.startMs,fps)>=Math.min(frameAt(w.endMs,fps),frameAt(endMs,fps)))throw new Error('어절 구간에 표시 가능한 프레임이 없습니다: '+c.expectedWord);
  return CueSchema.parse({...c,startMs:w.startMs,endMs:w.endMs});
 });
}
/** Shared-save integration hook: reconstruct stored cues from evidence and compare exact times. */
export function assertResolvedCues(cues:Cue[],visual:Visual,analysis:MasterTimeline|undefined,startMs:number,endMs:number,fps=CUE_DEFAULT_FPS){
 const rebuilt=resolveCues(cues.map(({slot,wordIndex,expectedWord})=>({slot,wordIndex,expectedWord})),visual,analysis,startMs,endMs,fps);
 if(rebuilt.some((c,i)=>c.startMs!==cues[i].startMs||c.endMs!==cues[i].endMs))throw new Error('저장된 모션 타이밍과 원본 어절 근거가 일치하지 않습니다.');
}
export function cueFrame(cue:Cue,sceneStartMs:number,fps:number){return Math.max(0,frameAt(cue.startMs,fps)-frameAt(sceneStartMs,fps));}
