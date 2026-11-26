import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {load,save,projectPath} from '../server/storage';
import {compileStoryboard,draftStoryboard} from '../src/core/storyboard';
const [command,id,file]=process.argv.slice(2);
if(!id||!['draft','apply'].includes(command))throw new Error('Usage: npx tsx scripts/storyboard.ts draft ID | apply ID FILE');
const p=await load(id);
if(command==='draft'){
 const draft=draftStoryboard(p);const out=path.join(path.dirname(projectPath(id)),'storyboard.draft.json');await writeFile(out,JSON.stringify(draft,null,2));console.log('Draft (not production-ready):',out);
}else{
 if(!file)throw new Error('Validated storyboard JSON path required');
 const data=JSON.parse(await readFile(file,'utf8'));const result=compileStoryboard(p,data);const saved=await save(result);console.log('Storyboard applied to revision',saved.revision);
}
