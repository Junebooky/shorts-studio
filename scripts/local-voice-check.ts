import {randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadEnv} from 'vite';
import {VoiceOptions} from '../src/core/elevenlabs';
import {demo} from '../src/core/project';
import {isCurrent} from '../src/core/timing';
import {generateNarration} from '../server/elevenlabs';
import {load,save,root} from '../server/storage';

// Fixed, public Korean sample; no user's project, text model, or personal material.
export const SAMPLE='안녕하세요. 오늘은 작은 습관에 대해 이야기해 볼게요. 매일 한 걸음씩 시작하면 새로운 변화가 찾아옵니다.';
export type CheckEnv={ELEVENLABS_API_KEY?:string;ELEVENLABS_VOICE_ID?:string};
export function voiceCheckPlan(args:string[],env:CheckEnv,ci:boolean){
 const allowed=new Set(['--execute','--accept-provider-cost']);
 if(args.some(a=>!allowed.has(a))||new Set(args).size!==args.length)throw new Error('지원 옵션: --execute --accept-provider-cost');
 const execute=args.includes('--execute'),consent=args.includes('--accept-provider-cost');
 if(execute!==consent)throw new Error('실제 요청은 --execute와 --accept-provider-cost를 함께 지정해야 합니다.');
 if(execute&&ci)throw new Error('CI에서는 실제 성우 연결 검사를 실행할 수 없습니다.');
 const keyConfigured=!!env.ELEVENLABS_API_KEY?.trim();
 const parsed=VoiceOptions.safeParse({voiceId:env.ELEVENLABS_VOICE_ID?.trim()??''});
 const ready=keyConfigured&&parsed.success;
 if(execute&&!ready)throw new Error('로컬 .env.local에 ElevenLabs 키와 유효한 기본 Voice ID를 설정하세요.');
 return {execute,keyConfigured,voiceConfigured:parsed.success,ready,scriptCharacters:Array.from(SAMPLE).length,maximumTtsRequests:execute?1:0};
}
export async function runLocalVoiceCheck(args:string[],env:CheckEnv,ci:boolean,request:typeof fetch=fetch){
 const plan=voiceCheckPlan(args,env,ci);
 if(!plan.execute)return {version:1,status:'dry-run' as const,...plan,externalCalls:0};
 const id='voice-check-'+randomUUID();let externalCalls=0;let stage='save';
 try{
  const p=await save({...demo,id,title:'한국어 성우 연결 확인',revision:0,script:SAMPLE,audio:null,captions:[],scenes:[],timingSource:'unverified'});
  stage='voice';
  const once:typeof fetch=async(url,init)=>{
   if(externalCalls!==0)throw new Error('추가 요청 차단');
   // Exact origin and expected route; never pass credentials to arbitrary destinations.
   const u=new URL(String(url));
   if(u.origin!=='https://api.elevenlabs.io'||u.pathname!=='/v1/text-to-speech/'+encodeURIComponent(env.ELEVENLABS_VOICE_ID!.trim())+'/with-timestamps')throw new Error('예상하지 않은 음성 요청');
   externalCalls++;return request(url,init);
  };
  const result=await generateNarration(id,{voiceId:env.ELEVENLABS_VOICE_ID!.trim(),revision:p.revision},{apiKey:env.ELEVENLABS_API_KEY!.trim()},once);
  stage='verify';
  const q=await load(id);
  if(!q.audio)throw new Error('저장된 음성 없음');
  const wav=await readFile(path.join(root,'public',q.audio));
  if(wav.length<46||wav.toString('ascii',0,4)!=='RIFF'||wav.toString('ascii',8,12)!=='WAVE'||wav.readUInt32LE(24)!==24000||wav.readUInt16LE(22)!==1||wav.readUInt16LE(34)!==16||wav.readUInt32LE(40)!==wav.length-44||!wav.subarray(44).some(x=>x!==0))throw new Error('음성 데이터 검사 실패');
  if(Math.ceil((wav.length-44)/2/24000*1000)!==q.durationMs)throw new Error('음성 길이 검사 실패');
  const matched=!result.needsAlignment&&isCurrent(q.analysis,q)&&q.analysis?.status==='matched'&&q.analysis.coverage===1&&q.captions.length>0;
  return {version:1,status:matched?'matched' as const:'needs-alignment' as const,projectId:id,externalCalls,durationMs:q.durationMs,wordCount:q.analysis?.words.length??0,captionCount:q.captions.length,pcmSha256:createHash('sha256').update(wav.subarray(44)).digest('hex'),voiceApproved:false};
 }catch{
  // No provider response body, key, voice ID, filesystem location or raw error in logs.
  // Partial project and any usable generated audio remain on disk for the editor.
  return {version:1,status:'failed' as const,projectId:stage==='save'?undefined:id,stage,externalCalls};
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const env=loadEnv('development',root,['ELEVENLABS_']);
  const report=await runLocalVoiceCheck(process.argv.slice(2),env,!!process.env.CI||!!process.env.GITHUB_ACTIONS);
  console.log(JSON.stringify(report,null,2));
  if(report.status==='failed'||report.status==='needs-alignment')process.exitCode=1;
 }catch(e){
  // Argument/plan failures are controlled messages. Loading env may expose raw paths,
  // so emit a fixed fallback rather than the arbitrary thrown error.
  console.error('실행 설정을 확인하세요. 실제 요청은 --execute --accept-provider-cost, 로컬 키와 기본 Voice ID가 모두 필요하며 CI 실행은 금지됩니다.');
  process.exitCode=1;
 }
}
