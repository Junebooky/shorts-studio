import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {verifyCriticFrames} from '../server/quality/critic-current';
import {buildCriticRequest} from '../src/core/quality/critic';
import {summarizeScenes} from '../src/core/quality/scenes';
test('actual file bytes must match each proof',async()=>{const dir=await mkdtemp(path.join(tmpdir(),'shorts-critic-'));try{const file=path.join(dir,'0.png'),bytes=Buffer.from('synthetic fixture');await writeFile(file,bytes);const request=buildCriticRequest({projectId:'fixture',revision:1,runId:'run'},{frames:[0],frameProofs:[{frame:0,sha256:createHash('sha256').update(bytes).digest('hex')}],scenes:summarizeScenes({durationMs:1000,scenes:[{id:'s',startMs:0,endMs:1000}],captions:[]},30,[0])},true);await verifyCriticFrames(request,dir);await writeFile(file,'changed');await assert.rejects(verifyCriticFrames(request,dir));await rm(file);await assert.rejects(verifyCriticFrames(request,dir));}finally{await rm(dir,{recursive:true,force:true});}});
