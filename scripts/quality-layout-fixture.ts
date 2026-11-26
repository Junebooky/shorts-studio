import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {load,root} from '../server/storage';
import {render,stills} from '../server/render';
import {inspectQuality} from '../server/quality';
import {technicalPass} from '../src/core/quality';
const p=await load('demo');
const out=path.join(root,'out','quality-layout-fixture');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const video=await render(p,()=>{},.5);
const dir=await stills(p,path.join(out,'frames'));
const report=await inspectQuality(p,video,dir,'preview');
await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));
assert.ok(technicalPass(report),'technical checks failed');
assert.ok(report.layout,'layout report missing');
assert.ok(report.frames.length>0,'no frames');
assert.equal(report.layout.sampled.length,report.frames.length,'some frames missing sidecar');
assert.deepEqual(report.layout.missing,[],'missing expected visible marked text');
const first=report.frames[0],sidecar=path.join(dir,first+'.layout.json');
const original=await readFile(sidecar,'utf8');
const data=JSON.parse(original);data.sha256='0'.repeat(64);
await writeFile(sidecar,JSON.stringify(data));
try{
 const stale=await inspectQuality(p,video,dir,'preview');
 assert.ok(stale.layout?.missing.includes(first),'stale evidence was trusted');
 assert.ok(stale.checks.filter(c=>c.id.startsWith('layout-')).every(c=>c.status!=='pass'),'incomplete evidence passed');
}finally{await writeFile(sidecar,original);}
console.log('Actual Remotion frame-bound layout QA:',report.layout.sampled.length,'frames;',report.layout.findings.length,'geometry candidates (not art approval)');
