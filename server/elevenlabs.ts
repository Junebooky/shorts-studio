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
async function exclusive<T>(id:string,fn:()=>Promise<T>){if(active.has(id))throw new Error('음성 작업이 이미 진행 중입니다.');active.add(id);try{return await fn();}finally{active.delete(id);}}
// Buffer.from silently discards invalid characters; reject corrupted provider payloads first.
export function decodeSpeechPcm(value:string):Buffer{
 const maxBytes=35*1024*1024-44;
 if(!value||value.length>Math.ceil(maxBytes/3)*4||value.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(value))throw new Error('잘못된 음성 Base64 데이터');
 const pcm=Buffer.from(value,'base64');
 if(!pcm.length||pcm.length>maxBytes||pcm.toString('base64')!==value)throw new Error('잘못된 음성 Base64 데이터');
 return pcm;
}
export function pcmToWav(pcm:Buffer,rate=24000){if(!pcm.length||pcm.length%2||pcm.length>35*1024*1024-44)throw new Error('잘못된 PCM 데이터');const h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return {wav:Buffer.concat([h,pcm]),durationMs:Math.ceil(pcm.length/2/rate*1000)};}
export function elevenClient(config:ElevenConfig,request:typeof fetch=fetch){
 async function call(route:string,init:RequestInit={}){if(!config.apiKey)throw new Error('로컬 .env.local에 ELEVENLABS_API_KEY를 설정하세요.');let response:Response;try{response=await request('https://api.elevenlabs.io'+route,{...init,headers:{'xi-api-key':config.apiKey,...init.headers},redirect:'error',signal:AbortSignal.timeout(120000)});}catch{throw new Error('ElevenLabs 연결 실패 또는 시간 초과. 자동 재시도하지 않습니다.');}if(!response.ok)throw new Error('ElevenLabs 요청 실패 (HTTP '+response.status+'). 권한, 잔여 크레딧, 모델/음성 설정을 확인하세요.');try{return await response.json();}catch{throw new Error('ElevenLabs 응답 JSON 오류. 자동 재시도하지 않습니다.');}}
 return {async voices(){const raw=z.object({voices:z.array(z.object({voice_id:z.string(),name:z.string(),labels:z.record(z.string()).optional(),verified_languages:z.array(z.object({language:z.string().optional(),locale:z.string().optional()})).nullable().optional()})),has_more:z.boolean().optional()}).parse(await call('/v2/voices?page_size=100'));return {voices:raw.voices.map(v=>({id:v.voice_id,name:v.name,korean:v.labels?.language==='ko'||!!v.verified_languages?.some(l=>l.language==='ko'||l.locale?.startsWith('ko'))})),hasMore:raw.has_more??false};},
 async speech(text:string,options:unknown){const o=VoiceOptions.parse(options);return SpeechResponse.parse(await call('/v1/text-to-speech/'+encodeURIComponent(o.voiceId)+'/with-timestamps?output_format=pcm_24000',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,model_id:o.model,...(o.model==='eleven_multilingual_v2'?{}:{language_code:'ko'}),voice_settings:{speed:o.speed},apply_text_normalization:'auto'})}));},
 async align(audio:Buffer,text:string,ext:string){const form=new FormData();form.append('file',new Blob([new Uint8Array(audio)],{type:ext==='wav'?'audio/wav':'audio/mpeg'}),'narration.'+ext);form.append('text',text);return call('/v1/forced-alignment',{method:'POST',body:form});}};
}
function check(p:Project,revision:number){if(p.id==='demo'||p.revision!==revision||!p.script.trim()||p.script.length>3000)throw new Error('저장된 프로젝트와 최신 리비전, 1~3000자 대본이 필요합니다.');}
async function evidence(id:string,data:unknown){const dir=path.join(path.dirname(projectPath(id)),'transcription');await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'elevenlabs-'+randomUUID()+'.json'),JSON.stringify(data,null,2));}
export async function generateNarration(id:string,input:unknown,config:ElevenConfig,request:typeof fetch=fetch){return exclusive(id,async()=>{const o=VoiceOptions.extend({revision:z.number().int().nonnegative()}).parse(input);const p=await load(id);check(p,o.revision);const res=await elevenClient(config,request).speech(p.script,o);const pcm=decodeSpeechPcm(res.audio_base64);const {wav,durationMs}=pcmToWav(pcm);if(!pcm.some(byte=>byte!==0))throw new Error('생성된 음성에 소리가 없습니다. 자동 재시도하지 않습니다.');if(durationMs<1000||durationMs>180000)throw new Error('생성 음성 길이 1~180초 범위 초과');const audio=await audioUpload(id,'wav',wav);
await evidence(id,{source:'elevenlabs-tts',script:p.script,revision:p.revision,audio,durationMs,options:o,alignment:res.alignment,normalized_alignment:res.normalized_alignment});
let result;try{result=alignTranscript({script:p.script,audio,durationMs,source:'elevenlabs-tts',segments:characterSegments(res.alignment,p.script)});if(result.analysis.status!=='matched')throw new Error('원문 불일치');}catch{const next=await save({...p,audio,durationMs,analysis:undefined,direction:undefined,captions:[],scenes:[],music:undefined,timingSource:'unverified'});return {project:next,needsAlignment:true};}
const next=await save({...p,audio,durationMs,...result,direction:undefined,scenes:[],music:undefined,timingSource:'elevenlabs-tts'});return {project:next,needsAlignment:false};});}
export async function alignNarration(id:string,revision:number,config:ElevenConfig,request:typeof fetch=fetch){return exclusive(id,async()=>{const p=await load(id);check(p,revision);if(!p.audio||!p.audio.startsWith('workspace/'+id+'/'))throw new Error('원본 음성 파일을 등록하세요.');const raw=await elevenClient(config,request).align(await readFile(path.join(root,'public',p.audio)),p.script,path.extname(p.audio).slice(1));const f=forcedSegments(raw,p.script);const result=alignTranscript({script:p.script,audio:p.audio,durationMs:p.durationMs,source:'elevenlabs-align',segments:f.segments});await evidence(id,{source:'elevenlabs-align',revision,raw,...result});if(result.analysis.status!=='matched')throw new Error('강제 정렬 결과 검수 필요. 기존 프로젝트 유지');return save({...p,...result,scenes:[],direction:undefined,timingSource:'elevenlabs-align'});});}
