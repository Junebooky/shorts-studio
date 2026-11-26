import {readFile,stat} from 'node:fs/promises';
import {currentCriticRequest,checkCurrentCriticResult} from '../server/quality/critic-current';
const [action,id,file,...extra]=process.argv.slice(2);
if(!id||extra.length||!(action==='prepare'&&!file||action==='check'&&file))throw new Error('사용법: npx tsx scripts/quality-critic.ts prepare PROJECT_ID | check PROJECT_ID RESULT.json');
if(action==='prepare'){
 const {request,frameDirectory}=await currentCriticRequest(id);console.log(JSON.stringify({request,frameDirectory},null,2));
}else{
 if((await stat(file)).size>5*1024*1024)throw new Error('5MB 이하 결과 JSON을 선택해 주세요.');
 const result=await checkCurrentCriticResult(id,JSON.parse(await readFile(file,'utf8')));
 console.log(JSON.stringify({reviewed:result.reviewed,total:result.total,issues:result.issues,verified:'current frame references only; no visual approval'},null,2));
}
