import {z} from 'zod';
const interval={startMs:z.number().int().nonnegative(),endMs:z.number().int().positive()};
const Word=z.object({text:z.string().min(1).max(200),...interval,confidence:z.number().min(0).max(1).optional()});
export const Segment=z.object({text:z.string().min(1).max(2000),...interval,words:z.array(Word).max(1000).default([])});
export type TranscriptSegment=z.input<typeof Segment>;
export const MasterTimelineSchema=z.object({
 version:z.literal(1),source:z.enum(['srt','whisper','elevenlabs-tts','elevenlabs-align']),sourceScript:z.string().max(50000),sourceAudio:z.string().nullable(),durationMs:z.number().int().min(1000).max(180000),
 segments:z.array(Segment).max(1000),words:z.array(Word).max(5000),pauses:z.array(z.object(interval)).max(5001),
 coverage:z.number().min(0).max(1),status:z.enum(['matched','review']),issues:z.array(z.string()).max(2000)
});
export type MasterTimeline=z.infer<typeof MasterTimelineSchema>;
export const normalizeSpeech=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
function indexedScript(raw:string){const script=raw.normalize('NFC');let normalized='',starts:number[]=[],ends:number[]=[];let pos=0;for(const char of script){const token=normalizeSpeech(char);for(let i=0;i<token.length;i++){starts.push(pos);ends.push(pos+char.length);}normalized+=token;pos+=char.length;}return {script,normalized,starts,ends};}
export function parseWhisperJSON(input:unknown):TranscriptSegment[]{
 const word=z.object({word:z.string(),start:z.number().finite(),end:z.number().finite(),probability:z.number().min(0).max(1).optional()});
 const schema=z.object({segments:z.array(z.object({text:z.string(),start:z.number().finite(),end:z.number().finite(),words:z.array(word).optional()})).max(1000)});
 const ms=(s:number)=>Math.round(s*1000);
 return schema.parse(input).segments.filter(s=>s.text.trim()).map(s=>({text:s.text.trim(),startMs:ms(s.start),endMs:ms(s.end),words:(s.words||[]).filter(w=>w.word.trim()).map(w=>({text:w.word.trim(),startMs:ms(w.start),endMs:ms(w.end),confidence:w.probability}))}));
}
export function alignTranscript(input:{script:string;audio:string|null;durationMs:number;source:'srt'|'whisper'|'elevenlabs-tts'|'elevenlabs-align';segments:TranscriptSegment[]}){
 const {script,normalized,starts,ends}=indexedScript(input.script);
 const segments=z.array(Segment).min(1).max(1000).parse(input.segments);
 const issues:string[]=[];const words:z.infer<typeof Word>[]=[];let previousEnd=0,cursor=0,matched=0;
 const captions=segments.map((segment,i)=>{
  if(segment.startMs<previousEnd||segment.endMs<=segment.startMs||segment.endMs>input.durationMs)throw new Error('발화 구간 시간 오류: '+(i+1));
  previousEnd=segment.endMs;
  let prev=segment.startMs;
  for(const word of segment.words){
   if(word.startMs<prev||word.endMs<=word.startMs||word.endMs>segment.endMs)throw new Error('어절 시간 오류: '+(i+1)+' / '+word.text);
   words.push(word);prev=word.endMs;
   if(word.confidence!==undefined&&word.confidence<.5)issues.push('낮은 어절 인식 신뢰도: '+word.text);
  }
  const token=normalizeSpeech(segment.text);
  // A matching caption is not sufficient if its word anchors describe different speech.
  if(segment.words.length&&normalizeSpeech(segment.words.map(w=>w.text).join(''))!==token)issues.push('자막과 어절 근거 불일치: 구간 '+(i+1));
  if((input.source==='elevenlabs-tts'||input.source==='elevenlabs-align')&&!segment.words.length)issues.push('어절 타임스탬프 누락: 구간 '+(i+1));
  const at=token?normalized.indexOf(token,cursor):-1;
  let text=segment.text;
  // Only restore original spelling/spacing when the whole segment has an exact normalized match.
  // Ambiguous resynchronization and unmatched words retain ASR text and measured timestamps.
  const ambiguous=at>cursor&&normalized.indexOf(token,at+token.length)>=0;
  if(at>=0&&!ambiguous){
   if(at>cursor)issues.push('원본 대본 누락 가능: '+(at-cursor)+'자 (구간 '+(i+1)+')');
   const last=at+token.length;
   const end=starts[last]??script.length;
   text=script.slice(starts[at],Math.max(ends[last-1],end)).trim();
   matched+=token.length;cursor=last;
  }else issues.push('원문 일치 불확실: 구간 '+(i+1)+' — '+segment.text.slice(0,60));
  if(text.length>200)throw new Error('자막이 200자를 넘습니다. 실제 타임스탬프에 따라 분할하세요.');
  return {id:'cap-'+i,text,startMs:segment.startMs,endMs:segment.endMs};
 });
 if(cursor<normalized.length)issues.push('원본 대본 끝부분 미정렬: '+(normalized.length-cursor)+'자');
 if(!normalized.length)issues.push('원본 대본 없음');
 if(!input.audio)issues.push('음성 파일 없음');
 const anchors=segments.flatMap(s=>s.words.length?s.words:[s]);
 const pauses:{startMs:number;endMs:number}[]=[];let end=0;
 for(const a of anchors){if(a.startMs-end>=250)pauses.push({startMs:end,endMs:a.startMs});end=a.endMs;}
 if(input.durationMs-end>=250)pauses.push({startMs:end,endMs:input.durationMs});
 const analysis=MasterTimelineSchema.parse({version:1,source:input.source,sourceScript:input.script,sourceAudio:input.audio,durationMs:input.durationMs,segments,words,pauses,coverage:normalized.length?matched/normalized.length:0,status:issues.length?'review':'matched',issues});
 return {captions,analysis};
}
export const isCurrent=(a:MasterTimeline|undefined,p:{script:string;audio:string|null;durationMs:number})=>!!a&&a.sourceScript===p.script&&a.sourceAudio===p.audio&&a.durationMs===p.durationMs;

/** Adapter for MotionCraft's original faster-whisper word helper. Boundaries come only from observed words. */
export function parseMotionCraftWords(input:unknown):TranscriptSegment[]{
 const schema=z.object({mode:z.literal('word'),words:z.array(z.object({w:z.string().min(1),start:z.number().finite(),end:z.number().finite(),p:z.number().min(0).max(1)})).min(1).max(5000)});
 const rows=schema.parse(input).words.map(w=>({text:w.w.trim(),startMs:Math.round(w.start*1000),endMs:Math.round(w.end*1000),confidence:w.p})).filter(w=>w.text);
 const segments:TranscriptSegment[]=[];let group:typeof rows=[];let prev=0;
 const flush=()=>{if(!group.length)return;segments.push({text:group.map(w=>w.text).join(' '),startMs:group[0].startMs,endMs:group[group.length-1].endMs,words:group});group=[];};
 for(const word of rows){
  if(word.startMs<prev||word.endMs<=word.startMs)throw new Error('MotionCraft 어절 시간 겹침 또는 역전: '+word.text);
  const length=group.map(w=>w.text).join(' ').length;
  if(group.length&&(word.startMs-prev>=300||length+word.text.length+1>34))flush();
  group.push(word);prev=word.endMs;
  if(/[.!?。！？]$/.test(word.text))flush();
 }flush();return segments;
}
