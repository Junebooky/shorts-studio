import {characterSegments} from '../../src/core/elevenlabs';
import {alignTranscript} from '../../src/core/timing';
import {demo,type Project} from '../../src/core/project';
export const sentences=['웨이퍼는 실리콘 원기둥을 얇게 잘라 만들어요.','산화는 산소로 표면에 보호막을 입혀요.','포토는 마스크에 빛을 비춰 회로를 그려요.','식각은 필요 없는 부분만 깎아 내요.','증착은 박막을 쌓고 이온을 주입해요.','금속 배선은 소자를 연결해 전기가 흘러요.','이디에스는 칩을 검사해 불량을 골라요.','패키징은 칩을 감싸고 기판에 연결해요.'];
export const script=sentences.join(' ');
export function processFixture(){
 const chars=Array.from(script),step=.13,durationMs=Math.ceil((chars.length*step+.4)*1000),pcm=Buffer.alloc(Math.ceil(durationMs*24)*2);for(let i=0;i<pcm.length/2;i++)pcm.writeInt16LE(Math.round(Math.sin(i*2*Math.PI*210/24000)*1800),i*2);
 const alignment={characters:chars,character_start_times_seconds:chars.map((_,i)=>i*step),character_end_times_seconds:chars.map((_,i)=>(i+1)*step)};
 return {pcm,alignment,durationMs};
}
export function processProject():Project{
 const {alignment,durationMs}=processFixture(),audio='workspace/process-test/voice.wav';
 return {...demo,id:'process-test',revision:1,script,durationMs,audio,timingSource:'elevenlabs-tts',styleId:'editorial',...alignTranscript({script,audio,durationMs,source:'elevenlabs-tts',segments:characterSegments(alignment,script)}),scenes:[]};
}
