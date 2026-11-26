import {test} from 'node:test';import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';import {rm,writeFile,readFile} from 'node:fs/promises';import path from 'node:path';
import {demo} from '../src/core/project';import {root,load,save} from '../server/storage';
import {assertRetryReady,retrySnapshot,assertRetryCurrent,withRetryLease} from '../server/quality/retry';
import {runQuick} from '../server/quick-create';import {emptyBrief} from '../src/core/creative-brief';import {mockQuickRequest} from './fixtures/quick-provider';
test('retry rejects incomplete and stale projects; detects changed audio and saved revision',async()=>{assert.throws(()=>assertRetryReady(demo,0));let id:string|undefined;const mock=mockQuickRequest();try{
 const q=await runQuick({topic:'반도체 공정',brief:{...emptyBrief,purpose:'반도체 공정 설명'},styleId:'editorial',voice:{voiceId:'fixture'},consent:true},{directorApiKey:'fixture',apiKey:'fixture'},(_s,_n,p)=>{if(p)id=p;},{request:mock.request,render:async()=>'/fixture-only.mp4',quality:async()=>({version:1,mode:'final',frames:[],checks:[{id:'mock',name:'mock',status:'pass',required:true,detail:'fixture only'}]})});
 const p=q.project;await assert.rejects(retrySnapshot(p.id,p.revision-1));const snapshot=await retrySnapshot(p.id,p.revision);await assertRetryCurrent(snapshot);
 const f=path.join(root,'public',p.audio!),bytes=await readFile(f);const changed=Buffer.from(bytes);changed[changed.length-1]^=1;await writeFile(f,changed);await assert.rejects(assertRetryCurrent(snapshot));await writeFile(f,bytes);await assertRetryCurrent(snapshot);
 await save({...await load(p.id),title:'changed fixture'});await assert.rejects(assertRetryCurrent(snapshot));assert.deepEqual(mock.calls,['script','voice','storyboard']);
 }finally{if(id)for(const d of [path.join(root,'workspace','projects',id),path.join(root,'public','workspace',id)])await rm(d,{recursive:true,force:true});}});
test('same-project retry lease refuses concurrent retry',async()=>{const id=randomUUID();try{await withRetryLease(id,async()=>{await assert.rejects(withRetryLease(id,async()=>{}));});await withRetryLease(id,async()=>{});}finally{await rm(path.join(root,'out',id),{recursive:true,force:true});}});
