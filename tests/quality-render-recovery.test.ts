import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';import {hostname,tmpdir} from 'node:os';import path from 'node:path';
import {inspectRenderLock,recoverRender,makeLease} from '../server/quality/render-recovery';
import {publishRender} from '../server/quality/render-output';
async function fixture(fn:(dest:string,dir:string)=>Promise<void>){const dir=await mkdtemp(path.join(tmpdir(),'shorts-recovery-'));try{const dest=path.join(dir,'r1.mp4');await writeFile(dest,'old');await fn(dest,dir);}finally{await rm(dir,{recursive:true,force:true});}}
test('live writer and malformed legacy lock cannot be removed',()=>fixture(async(dest,dir)=>{
 await publishRender(dest,async tmp=>{assert.equal((await inspectRenderLock(dest)).status,'active_or_reused_pid');await assert.rejects(recoverRender(dest,true));await writeFile(tmp,'new');});
 await writeFile(dest+'.render.lock','legacy');assert.equal((await inspectRenderLock(dest)).status,'unverified');await assert.rejects(recoverRender(dest,true));assert.ok((await readdir(dir)).includes('r1.mp4.render.lock'));
}));
test('exited process lease recovers only its own partial, keeps prior MP4',()=>fixture(async(dest,dir)=>{
 const tmp=path.join(dir,'.r1-12345678-1234-1234-1234-123456789abc.partial.mp4'),other=path.join(dir,'other.partial.mp4');
 const child=spawnSync(process.execPath,['-e','process.stdout.write(String(process.pid))'],{encoding:'utf8'});assert.equal(child.status,0);
 await writeFile(tmp,'partial');await writeFile(other,'other');await writeFile(dest+'.render.lock',JSON.stringify({...makeLease(tmp),pid:Number(child.stdout)}));
 assert.equal((await inspectRenderLock(dest)).status,'interrupted');await assert.rejects(recoverRender(dest,false));assert.equal(await readFile(tmp,'utf8'),'partial');
 assert.deepEqual(await recoverRender(dest,true),{status:'recovered',previousOutputExists:true});assert.equal(await readFile(dest,'utf8'),'old');assert.equal(await readFile(other,'utf8'),'other');assert.deepEqual((await readdir(dir)).sort(),['other.partial.mp4','r1.mp4']);assert.equal((await inspectRenderLock(dest)).status,'unlocked');
}));
test('foreign host or path traversal refused',()=>fixture(async(dest,dir)=>{
 const tmp=path.join(dir,'.r1-12345678-1234-1234-1234-123456789abc.partial.mp4');for(const lease of [{...makeLease(tmp),host:hostname()+'-foreign'},{...makeLease(tmp),temporary:'../r1.mp4'}]){await writeFile(dest+'.render.lock',JSON.stringify(lease));assert.equal((await inspectRenderLock(dest)).status,'unverified');await assert.rejects(recoverRender(dest,true));assert.equal(await readFile(dest,'utf8'),'old');}
}));
