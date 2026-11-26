import {agentStatus,agentAdvance} from '../server/production';import {load} from '../server/storage';
const [command,id,taskId,stage,...notes]=process.argv.slice(2);if(!id)throw new Error('Usage: npx tsx scripts/agent.ts status ID | advance ID TASK_ID STAGE NOTES');
if(command==='status')console.log(JSON.stringify(await agentStatus(id),null,2));else if(command==='advance'){if(!taskId||!stage)throw new Error('작업 ID 및 단계 필요');const p=await load(id);console.log(JSON.stringify(await agentAdvance(id,taskId,stage,p.revision,notes.join(' ')),null,2));}else throw new Error('Unknown command');
