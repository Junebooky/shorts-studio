import {load} from '../server/storage';import {redesignSaved} from '../server/semantic-redesign';
const [id,flag]=process.argv.slice(2);if(!id||flag!=='--replace-scenes')throw new Error('Usage: npx tsx scripts/redesign-semiconductor.ts PROJECT_ID --replace-scenes');
const p=await load(id);const q=await redesignSaved(id,p.revision,(stage,n)=>console.log(stage,Math.round(n*100)+'%'));console.log(JSON.stringify({projectId:q.project.id,revision:q.project.revision,file:q.file,scenes:q.project.scenes.length,voiceRegenerated:false,approved:false}));
