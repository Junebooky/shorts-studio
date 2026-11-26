import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import path from 'node:path';
import {load,save,root} from './storage';import {getTask} from './agent-store';import {terminal} from '../src/core/agent-task';import {processStoryboard,isEightProcessTopic} from '../src/core/semiconductor';import {inspectQuality} from './quality';import {technicalPass} from '../src/core/quality';import type {QuickStage} from '../src/core/quick-create';
const hash=async(rel:string)=>createHash('sha256').update(await readFile(path.join(root,'public',rel))).digest('hex');
export async function redesignSaved(id:string,revision:number,update:(stage:QuickStage,n:number,id:string)=>void){
 const p=await load(id);if(p.id==='demo'||p.revision!==revision)throw new Error('최신 저장본을 선택해 주세요.');
 if(!isEightProcessTopic(p.title)&&!isEightProcessTopic(p.creativeBrief?.purpose??'')&&!isEightProcessTopic(p.script))throw new Error('반도체 8대 공정 프로젝트에서만 이 기능을 사용할 수 있어요.');
 const task=await getTask(id);if(task&&!terminal(task.stage))throw new Error('진행 중인 에이전트 작업을 완료하거나 취소한 뒤 다시 시도해 주세요.');
 const board=processStoryboard(p);const original=await hash(p.audio!);
 update('storyboard',.1,id);const q=await save(board);update('render',.15,id);
 const file=await (await import('./render')).render(q,n=>update('render',.15+.8*Math.max(0,Math.min(1,n)),id));
 update('verify',.96,id);const quality=await inspectQuality(q,file,undefined,'final');
 const latest=await load(id);if(latest.revision!==q.revision||latest.audio!==p.audio||await hash(p.audio!)!==original)throw new Error('영상 생성 중 프로젝트나 음성 파일이 바뀌었어요. 최신 상태를 확인해 주세요.');
 if(!technicalPass(quality))throw new Error('영상 파일 검사를 통과하지 못했어요. 새 장면은 저장되어 있어요.');
 update('done',1,id);return {project:q,file,quality,voiceHash:original};
}
