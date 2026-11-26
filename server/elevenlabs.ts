import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {VoiceOptions,SpeechResponse,characterSegments,forcedSegments} from '../src/core/elevenlabs';
import {alignTranscript,isCurrent} from '../src/core/timing';
import {load,save,audioUpload,root,projectPath} from './storage';
import type {Project} from '../src/core/project';
export type ElevenConfig={apiKey?:string;defaultVoice?:string};
const active=new Set<string>();
async function exclusive<T>(id:string,fn:()=>Promise<T>){if(active.has(id))throw new Error('이미 음성 작업을 진행하고 있어요. 작업이 끝난 뒤 다시 요청해 주세요.');active.add(id);try{return await fn();}finally{active.delete(id);}}
// Buffer.from silently discards invalid characters; reject corrupted provider payloads first.
export function decodeSpeechPcm(value:string):Buffer{
 const maxBytes=35*1024*1024-44;
 if(!value||value.length>Math.ceil(maxBytes/3)*4||value.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(value))throw new Error('ElevenLabs에서 받은 음성 데이터가 올바르지 않아요 (Base64). 요청 상태를 확인해 주세요.');
 const pcm=Buffer.from(value,'base64');
 if(!pcm.length||pcm.length>maxBytes||pcm.toString('base64')!==value)throw new Error('ElevenLabs에서 받은 음성 데이터가 올바르지 않아요 (Base64). 요청 상태를 확인해 주세요.');
 return pcm;
}
export function pcmToWav(pcm:Buffer,rate=24000){if(!pcm.length||pcm.length%2||pcm.length>35*1024*1024-44)throw new Error('받은 음성 데이터를 재생 가능한 파일로 만들 수 없어요 (PCM).');const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return {wav:Buffer.concat([h,pcm]),durationMs:Math.ceil(pcm.length/2/rate*1000)};}
export function elevenClient(config:ElevenConfig,request:typeof fetch=fetch){
 async function call(route:string,init:RequestInit={}){if(!config.apiKey)throw new Error('.env.local에 ELEVENLABS_API_KEY를 입력하고 스튜디오 서버를 다시 실행해 주세요.');let response:Response;try{response=await request('https://api.elevenlabs.io'+route,{...init,headers:{'xi-api-key':config.apiKey,...init.headers},redirect:'error',signal:AbortSignal.timeout(120000)});}catch{throw new Error('ElevenLabs에 연결하지 못했거나 응답 시간이 초과됐어요. 연결과 요청 상태를 확인해 주세요. 크레딧이 사용됐을 수 있어 자동으로 다시 요청하지 않아요.');}if(!response.ok)throw new Error('ElevenLabs 요청을 처리하지 못했어요 (HTTP '+response.status+'). 권한, 남은 크레딧, 음성 모델과 목소리 설정을 확인해 주세요. 자동으로 다시 요청하지 않아요.');try{return await response.json();}catch{throw new Error('ElevenLabs 응답을 읽지 못했어요 (JSON). 요청 상태를 확인해 주세요. 크레딧이 사용됐을 수 있어 자동으로 다시 요청하지 않아요.');}}
 return {async voices(){const raw=z.object({voices:z.array(z.object({voice_id:z.string(),name:z.string(),labels:z.record(z.string()).optional(),verified_languages:z.array(z.object({language:z.string().optional(),locale:z.string().optional()})).nullable().optional()})),has_more:z.boolean().optional()}).parse(await call('/v2/voices?page_size=100'));return {voices:raw.voices.map(v=>({id:v.voice_id,name:v.name,korean:v.labels?.language==='ko'||!!v.verified_languages?.some(l=>l.language==='ko'||l.locale?.startsWith('ko'))})),hasMore:raw.has_more??false};},
 async speech(text:string,options:unknown){const o=VoiceOptions.parse(options);return SpeechResponse.parse(await call('/v1/text-to-speech/'+encodeURIComponent(o.voiceId)+'/with-timestamps?output_format=pcm_24000',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,model_id:o.model,...(o.model==='eleven_multilingual_v2'?{}:{language_code:'ko'}),voice_settings:{speed:o.speed},apply_text_normalization:'auto'})}));},
 async align(audio:Buffer,text:string,ext:string){const form=new FormData();form.append('file',new Blob([new Uint8Array(audio)],{type:ext==='wav'?'audio/wav':'audio/mpeg'}),'narration.'+ext);form.append('text',text);return call('/v1/forced-alignment',{method:'POST',body:form});}};
}
function check(p:Project,revision:number){if(p.id==='demo'||p.revision!==revision||!p.script.trim()||p.script.length>3000)throw new Error('최신 프로젝트를 저장하고 1~3,000자의 대본을 입력해 주세요.');}
async function evidence(id:string,data:unknown){const dir=path.join(path.dirname(projectPath(id)),'transcription');await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'elevenlabs-'+randomUUID()+'.json'),JSON.stringify(data,null,2));}
export async function generateNarration(id:string,input:unknown,config:ElevenConfig,request:typeof fetch=fetch){return exclusive(id,async()=>{const o=VoiceOptions.extend({revision:z.number().int().nonnegative()}).parse(input);const p=await load(id);check(p,o.revision);const res=await elevenClient(config,request).speech(p.script,o);const {wav,durationMs}=pcmToWav(decodeSpeechPcm(res.audio_base64));if(durationMs<1000||durationMs>180000)throw new Error('만들어진 음성 길이가 지원 범위인 1~180초를 벗어났어요. 대본과 말하기 속도를 확인해 주세요.');const audio=await audioUpload(id,'wav',wav);
await evidence(id,{source:'elevenlabs-tts',script:p.script,revision:p.revision,audio,durationMs,options:o,alignment:res.alignment,normalized_alignment:res.normalized_alignment});
let result;try{result=alignTranscript({script:p.script,audio,durationMs,source:'elevenlabs-tts',segments:characterSegments(res.alignment,p.script)});if(result.analysis.status!=='matched')throw new Error('원문 불일치');}catch{const next=await save({...p,audio,durationMs,analysis:undefined,direction:undefined,captions:[],scenes:[],music:undefined,timingSource:'unverified'});return {project:next,needsAlignment:true};}
const next=await save({...p,audio,durationMs,...result,direction:undefined,scenes:[],music:undefined,timingSource:'elevenlabs-tts'});return {project:next,needsAlignment:false};});}
export async function alignNarration(id:string,revision:number,config:ElevenConfig,request:typeof fetch=fetch){return exclusive(id,async()=>{const p=await load(id);check(p,revision);if(!p.audio||!p.audio.startsWith('workspace/'+id+'/'))throw new Error('이 프로젝트에 원본 음성을 먼저 추가해 주세요.');const raw=await elevenClient(config,request).align(await readFile(path.join(root,'public',p.audio)),p.script,path.extname(p.audio).slice(1));const f=forcedSegments(raw,p.script);const result=alignTranscript({script:p.script,audio:p.audio,durationMs:p.durationMs,source:'elevenlabs-align',segments:f.segments});await evidence(id,{source:'elevenlabs-align',revision,raw,...result});if(result.analysis.status!=='matched')throw new Error('음성과 자막을 맞춘 결과에 확인이 필요한 부분이 있어요. 기존 프로젝트는 그대로 유지했어요.');return save({...p,...result,scenes:[],direction:undefined,timingSource:'elevenlabs-align'});});}
