import {inbox,inspectTask,claimTask} from '../server/agent-inbox';
const [cmd='list',id,taskId,...notes]=process.argv.slice(2);
try{
 let result:unknown;
 if(cmd==='list'&&!id)result=await inbox();
 else if(cmd==='inspect'&&id&&taskId&&!notes.length)result=await inspectTask(id,taskId);
 else if(cmd==='claim'&&id&&taskId&&notes.join(' ').trim())result=await claimTask(id,taskId,notes.join(' '));
 else throw new Error('Usage: npx tsx scripts/agent-inbox.ts list | inspect ID TASK_ID | claim ID TASK_ID NOTES');
 console.log(JSON.stringify(result,null,2));
}catch(e){console.error(e instanceof Error?e.message:'Local task check failed');process.exitCode=1;}
