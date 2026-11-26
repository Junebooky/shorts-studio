import {readFile,stat} from 'node:fs/promises';
import {createCurrentLoop,getCurrentLoop,prepareCurrentLoop,recordCurrentLoop} from '../server/quality/review-loop-store';
const [action,id,arg,extra,...rest]=process.argv.slice(2);
if(!id||!arg||rest.length||!['start','status','prepare','record'].includes(action)||action==='record'&&!extra||['status','prepare'].includes(action)&&extra)throw new Error('사용법: quality-loop.ts start PROJECT_ID PLAN.json [maxRounds] | status/prepare PROJECT_ID LOOP_ID | record PROJECT_ID LOOP_ID RESULT.json');
async function json(file:string){if((await stat(file)).size>5*1024*1024)throw new Error('5MB 이하 JSON만 지원해요.');return JSON.parse(await readFile(file,'utf8'));}
if(action==='prepare')console.log(JSON.stringify(await prepareCurrentLoop(id,arg),null,2));
else{
 const state=action==='start'?await createCurrentLoop(id,await json(arg),extra===undefined?3:Number(extra)):action==='record'?await recordCurrentLoop(id,arg,await json(extra!)):await getCurrentLoop(id,arg);
 console.log(JSON.stringify({loopId:state.loop.loopId,status:state.status,remaining:state.remaining,history:state.history,activePlan:state.activePlan,approval:state.approval},null,2));
}
