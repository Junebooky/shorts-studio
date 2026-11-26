import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {decodedFrames,fingerprint} from '../server/quality/integrity';
test('decode requires terminal progress and real count',()=>{assert.equal(decodedFrames('frame=  5\nprogress=continue\nframe=360\nprogress=end\n'),360);assert.throws(()=>decodedFrames('frame=10\nprogress=continue'));assert.throws(()=>decodedFrames('progress=end'));});
test('streaming fingerprint hashes bytes and rejects empty file',async()=>{const dir=await mkdtemp(path.join(os.tmpdir(),'shorts-integrity-'));try{const file=path.join(dir,'x.mp4');await writeFile(file,'abc');assert.deepEqual(await fingerprint(file),{bytes:3,sha256:'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'});await writeFile(file,'');await assert.rejects(fingerprint(file));}finally{await rm(dir,{recursive:true,force:true});}});
