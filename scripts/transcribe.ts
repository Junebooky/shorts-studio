import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {load,root,save} from '../server/storage';
import {alignTranscript,parseWhisperJSON,parseMotionCraftWords} from '../src/core/timing';
const p=await load(process.argv[2]||'demo');
const faster=process.argv.includes('--faster');
const model=process.argv.find(x=>x.startsWith('--model='))?.slice(8)||'small';
if(!['tiny','base','small','medium','large-v3'].includes(model))throw new Error('지원하는 모델: tiny, base, small, medium, large-v3');
if(!p.audio||!p.script.trim())throw new Error('원본 대본과 음성이 필요합니다');
const dir=path.join(root,'workspace','projects',p.id,'transcription');
await mkdir(dir,{recursive:true});
const audio=path.join(root,'public',p.audio);
const resultPath=faster?path.join(dir,'motioncraft-words.json'):path.join(dir,path.basename(audio,path.extname(audio))+'.json');
const args=faster?[path.join(root,'vendor/motioncraft/whisper_words.py'),audio,resultPath,'ko',model]:['-m','whisper',audio,'--language','ko','--model',model,'--word_timestamps','True','--output_format','json','--output_dir',dir];
await new Promise<void>((resolve,reject)=>{const child=spawn(process.env.WHISPER_PYTHON||'python',args,{stdio:'inherit',shell:false});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Whisper exit '+code)));});
const raw=JSON.parse(await readFile(resultPath,'utf8'));
const result=alignTranscript({script:p.script,audio:p.audio,durationMs:p.durationMs,source:'whisper',segments:faster?parseMotionCraftWords(raw):parseWhisperJSON(raw)});
// Keep raw evidence even when text alignment fails. Never replace existing timing on uncertain ASR.
const candidatePath=path.join(dir,'candidate.json');
await writeFile(candidatePath,JSON.stringify({projectId:p.id,baseRevision:p.revision,model,backend:faster?'faster-whisper':'whisper',...result},null,2));
if(result.analysis.status==='matched'){
 const next=await save({...p,...result,timingSource:'whisper',direction:undefined});
 console.log('리비전',next.revision,'원문 일치',Math.round(result.analysis.coverage*100)+'%');
}else{
 console.log('검수 필요: 기존 프로젝트 유지. 후보 파일',candidatePath,result.analysis.issues);
}
console.log('원문 일치',Math.round(result.analysis.coverage*100)+'%',result.analysis.status);
console.log('실제 재생 싱크 검수 필요. 어절 타이밍은 Whisper 추정치입니다.');
