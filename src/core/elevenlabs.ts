import {z} from 'zod';
import {normalizeSpeech,type TranscriptSegment} from './timing';
export const CharacterAlignment=z.object({characters:z.array(z.string().min(1)).min(1).max(20000),character_start_times_seconds:z.array(z.number().finite().nonnegative()),character_end_times_seconds:z.array(z.number().finite().nonnegative())});
export const SpeechResponse=z.object({audio_base64:z.string().min(1),alignment:CharacterAlignment.nullable().optional(),normalized_alignment:CharacterAlignment.nullable().optional()});
export const VoiceOptions=z.object({voiceId:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),model:z.enum(['eleven_multilingual_v2','eleven_v3','eleven_v4']).default('eleven_multilingual_v2'),speed:z.number().min(.7).max(1.2).default(1)});
type Anchor={text:string;startMs:number;endMs:number};
function group(words:Anchor[]):TranscriptSegment[]{const groups:TranscriptSegment[]=[];let batch:Anchor[]=[];const flush=()=>{if(batch.length){groups.push({text:batch.map(w=>w.text).join(' '),startMs:batch[0].startMs,endMs:batch[batch.length-1].endMs,words:batch});batch=[];}};
let end=0;for(const w of words){if(w.startMs<end||w.endMs<=w.startMs)throw new Error('음성 타이밍 겹침 또는 길이 오류: '+w.text);if(batch.length&&(w.startMs-end>=300||batch.map(x=>x.text).join(' ').length+w.text.length+1>32))flush();batch.push(w);end=w.endMs;if(/[.!?。！？]$/.test(w.text))flush();}flush();return groups;}
export function characterSegments(input:unknown,script:string):TranscriptSegment[]{
const a=CharacterAlignment.parse(input);const n=a.characters.length;if(a.character_start_times_seconds.length!==n||a.character_end_times_seconds.length!==n)throw new Error('문자 타임스탬프 배열 길이 오류');
if(normalizeSpeech(a.characters.join(''))!==normalizeSpeech(script))throw new Error('원본 문자 타이밍과 대본 불일치. 강제 정렬 필요');
let word='',start=0,end=0,previous=0;const words:Anchor[]=[];const flush=()=>{if(word){if(!normalizeSpeech(word)){if(words.length)words[words.length-1].text+=word;}else words.push({text:word,startMs:start,endMs:end});word='';}};
for(let i=0;i<n;i++){const c=a.characters[i],s=Math.round(a.character_start_times_seconds[i]*1000),e=Math.round(a.character_end_times_seconds[i]*1000);if(e<s||s<previous)throw new Error('문자 타임스탬프 역전/겹침');previous=e;if(/^\s+$/u.test(c)){flush();continue;}if(!word)start=s;word+=c;end=e;if(/[.!?。！？]$/u.test(c))flush();}flush();if(!words.length)throw new Error('발화 시간 없음');return group(words);}
export function forcedSegments(input:unknown,script:string){const r=z.object({words:z.array(z.object({text:z.string(),start:z.number().finite().nonnegative(),end:z.number().finite().nonnegative(),loss:z.number().finite().optional()})).min(1),loss:z.number().finite().optional()}).parse(input);
const words=r.words.filter(w=>w.text.trim()).map(w=>({text:w.text.trim(),startMs:Math.round(w.start*1000),endMs:Math.round(w.end*1000)}));
if(normalizeSpeech(words.map(w=>w.text).join(''))!==normalizeSpeech(script))throw new Error('강제 정렬 결과의 텍스트가 원문과 다릅니다.');return {segments:group(words),loss:r.loss};}
