import {readFile,stat} from 'node:fs/promises';
import {currentCriticRequest} from '../server/quality/critic-current';
import {revisionTasks,buildRevisionPlan,buildRecheckRequest,validateRecheck} from '../src/core/quality/revision';
const [action,id,file,extra,...rest]=process.argv.slice(2);
if(!id||!file||rest.length||!['plan','prepare-recheck','check-recheck'].includes(action)||action==='prepare-recheck'&&extra||action==='check-recheck'&&!extra)throw new Error('사용법: quality-revision.ts plan PROJECT_ID CRITIC.json [major|all] | prepare-recheck PROJECT_ID PLAN.json | check-recheck PROJECT_ID PLAN.json RESULT.json');
async function json(name:string){if((await stat(name)).size>5*1024*1024)throw new Error('5MB 이하 JSON만 지원해요.');return JSON.parse(await readFile(name,'utf8'));}
const {request,frameDirectory}=await currentCriticRequest(id),input=await json(file);
if(action==='plan'){
 if(extra&&extra!=='major'&&extra!=='all')throw new Error('major 또는 all을 선택해 주세요.');
 const selected=revisionTasks(request,input).filter(t=>extra!=='major'||t.severity==='major').map(t=>t.id);
 console.log(JSON.stringify(buildRevisionPlan(request,input,selected).plan,null,2));
}else if(action==='prepare-recheck')console.log(JSON.stringify({...buildRecheckRequest(input,request),frameDirectory},null,2));
else console.log(JSON.stringify(validateRecheck(input,request,await json(extra!)),null,2));
