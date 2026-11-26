import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {demo,parseSrt,validate,type Project} from '../src/core/project';
import {alignTranscript} from '../src/core/timing';
import {compileStoryboard,type Storyboard} from '../src/core/storyboard';
import {audioUpload,load,root,save} from '../server/storage';
const dir=path.join(root,'workspace','fixtures'),id='voice-fixture';
const metadata=JSON.parse(await readFile(path.join(dir,'voice-fixture.json'),'utf8')) as {script:string;durationMs:number;voice:string};
const srt=await readFile(path.join(dir,'voice-fixture.srt'),'utf8');
const segments=parseSrt(srt);
const audio=await audioUpload(id,'wav',await readFile(path.join(dir,'voice-fixture.wav')));
const aligned=alignTranscript({script:metadata.script,audio,durationMs:metadata.durationMs,source:'srt',segments});
if(aligned.analysis.status!=='matched')throw new Error(aligned.analysis.issues.join('; '));
let revision=0;try{revision=(await load(id)).revision;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
const initial:Project={...demo,id,revision,title:'한국어 합성 음성 테스트',script:metadata.script,durationMs:metadata.durationMs,audio,timingSource:'srt',...aligned,scenes:[]};
const beats:Storyboard['beats']=[
 {captionIds:[segments[0].id],purpose:'작은 선택이 방향을 바꾸는 훅',metaphor:'세 개의 지점이 연결되며 길이 완성된다',headline:'작은 선택,\n새로운 방향',kicker:'01 / 시작',detail:'하루를 바꾸는 첫 행동',visual:{type:'path',labels:['선택','행동','방향']}},
 {captionIds:[segments[1].id],purpose:'큰 목표에서 오는 부담 표현',metaphor:'쌓인 과제와 완료 가능한 하나의 행동을 대조',headline:'처음부터\n너무 크게?',kicker:'02 / 부담',detail:'높은 진입장벽은 시작을 어렵게 한다',visual:{type:'contrast',left:'과한 목표',right:'작은 시작'}},
 {captionIds:[segments[2].id],purpose:'바로 가능한 행동 강조',metaphor:'하나의 행동에 시선을 집중',headline:'오늘 할 수 있는',kicker:'03 / 실천',detail:'지금 가능한 것부터',visual:{type:'focus',word:'딱 한 가지'}},
 {captionIds:[segments[3].id],purpose:'반복의 과정 설명',metaphor:'선택·실천·반복을 순환 경로로 연결',headline:'반복이 만드는\n변화',kicker:'04 / 과정',detail:'다음 선택이 조금씩 쉬워진다',visual:{type:'cycle',labels:['선택','실천','반복']}},
 {captionIds:[segments[4].id],purpose:'완벽주의 부담 완화',metaphor:'두 개의 짧은 문구를 리듬감 있게 대비',headline:'완벽하지 않아도',kicker:'05 / 여유',detail:'다시 시작할 수 있다',visual:{type:'typography',lines:['완벽보다','지속']}},
 {captionIds:[segments[5].id],purpose:'마무리 행동 제안',metaphor:'오늘에서 내일로 이어지는 길',headline:'내일도 한 걸음',kicker:'06 / 마무리',detail:'오늘부터 이어지는 습관',visual:{type:'path',labels:['오늘','한 걸음','내일']}}
];
const board:Storyboard={version:1,projectId:id,baseRevision:revision,direction:{author:'fixture',concept:'작은 행동의 시작과 반복을 연결하는 편집형 인포그래픽',audience:'일반 시청자',style:'따뜻한 종이색, 잉크 타이포, 절제된 청록색'},theme:{background:'#F6F3EA',foreground:'#172337',accent:'#236F67'},beats};
const p=compileStoryboard(initial,board);
const qa=validate(p);if(qa.errors.length)throw new Error(qa.errors.join('; '));
const saved=await save(p);const out=path.join(root,'out',id);await mkdir(out,{recursive:true});
await writeFile(path.join(out,'timing-evidence.json'),JSON.stringify({revision:saved.revision,durationMs:saved.durationMs,voice:metadata.voice,analysis:saved.analysis,storyboard:board},null,2));
console.log('Synthetic narration fixture ready',saved.id,saved.revision,saved.durationMs);
