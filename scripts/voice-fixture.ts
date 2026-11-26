import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {demo,parseSrt,validate,type Project,type SceneData} from '../src/core/project';
import {alignTranscript} from '../src/core/timing';
import {audioUpload,load,root,save} from '../server/storage';
const dir=path.join(root,'workspace','fixtures'),id='voice-fixture';
const metadata=JSON.parse(await readFile(path.join(dir,'voice-fixture.json'),'utf8')) as {script:string;durationMs:number;voice:string};
const srt=await readFile(path.join(dir,'voice-fixture.srt'),'utf8');
const segments=parseSrt(srt);
const audio=await audioUpload(id,'wav',await readFile(path.join(dir,'voice-fixture.wav')));
const aligned=alignTranscript({script:metadata.script,audio,durationMs:metadata.durationMs,source:'srt',segments});
if(aligned.analysis.status!=='matched')throw new Error(aligned.analysis.issues.join('; '));
const beats:Array<Pick<SceneData,'kind'|'headline'|'kicker'|'detail'>>=[
 {kind:'hook',headline:'작은 선택,\n새로운 방향',kicker:'01 · 시작',detail:'하루를 바꾸는 첫 행동'},
 {kind:'compare',headline:'목표가 너무 크면',kicker:'02 · 부담',detail:'시작하기가 어려워질 수 있다'},
 {kind:'steps',headline:'오늘의 한 가지',kicker:'03 · 실천',detail:'할 수 있는 행동부터'},
 {kind:'steps',headline:'반복이 만드는\n변화',kicker:'04 · 과정',detail:'다음 선택이 조금 더 쉬워진다'},
 {kind:'orbit',headline:'완벽하지 않아도',kicker:'05 · 여유',detail:'다시 선택할 기회가 있다'},
 {kind:'closing',headline:'내일도 한 걸음',kicker:'06 · 마무리',detail:'오늘부터 이어지는 습관'},
];
if(segments.length!==beats.length)throw new Error('fixture scene count mismatch');
const scenes=beats.map((beat,i)=>({id:'scene-'+i,startMs:i===0?0:segments[i].startMs,endMs:segments[i+1]?.startMs??metadata.durationMs,...beat}));
let revision=0;try{revision=(await load(id)).revision;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
const p:Project={...demo,id,revision,title:'한국어 합성 음성 테스트',script:metadata.script,durationMs:metadata.durationMs,audio,timingSource:'srt',...aligned,scenes,theme:{background:'#F6F3EA',foreground:'#172337',accent:'#236F67'}};
const qa=validate(p);if(qa.errors.length)throw new Error(qa.errors.join('; '));
const saved=await save(p);const out=path.join(root,'out',id);await mkdir(out,{recursive:true});
await writeFile(path.join(out,'timing-evidence.json'),JSON.stringify({revision:saved.revision,durationMs:saved.durationMs,voice:metadata.voice,analysis:saved.analysis},null,2));
console.log('Synthetic narration fixture ready',saved.id,saved.revision,saved.durationMs);
