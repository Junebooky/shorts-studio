import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {load,root} from '../server/storage';
import {normalizeSpeech,isCurrent} from '../src/core/timing';
const p=await load('voice-fixture');
const known=JSON.parse(await readFile(path.join(root,'workspace','fixtures','voice-fixture.json'),'utf8'));
const a=p.analysis;
assert.ok(a&&isCurrent(a,p)&&a.source==='whisper','ASR evidence missing or stale');
assert.ok(a.words.length>0,'No recognized words');
assert.ok(a.segments.length>0);
assert.equal(p.script,known.script);
const original=normalizeSpeech(known.script);
const recognized=normalizeSpeech(a.segments.map(s=>s.text).join(' '));
function distance(a:string,b:string){let row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+Number(a[i-1]!==b[j-1]));row=next;}return row[b.length];}
const evidence={source:'eSpeak NG Korean synthetic fixture; not human narrator',model:'faster-whisper base',original:known.script,recognized:a.segments.map(s=>s.text).join(' '),normalizedCharacterErrorRate:distance(original,recognized)/Math.max(1,original.length),coverage:a.coverage,status:a.status,wordCount:a.words.length,segments:a.segments.length,issues:a.issues,disclaimer:'Runtime integration only. Text matching and ASR word estimates are not acoustic forced alignment. No accuracy threshold claimed.'};
const out=path.join(root,'out','voice-fixture');await mkdir(out,{recursive:true});await writeFile(path.join(out,'asr-report.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));
