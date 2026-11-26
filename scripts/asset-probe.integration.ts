import {test} from 'node:test';import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';import {rm} from 'node:fs/promises';import path from 'node:path';
import {pcmToWav} from '../server/elevenlabs';
import {uploadAsset,verifyAssets} from '../server/assets';
import {assetUsage,assetLibrarySummary} from '../src/core/assets';
import {root} from '../server/storage';
test('real synthetic WAV duration overrides false client hint and verifies stored length',async()=>{
 const id='probe-'+randomUUID(),wav=pcmToWav(Buffer.alloc(48000)).wav;
 try{
  const a=await uploadAsset(id,{name:'tone.wav',ext:'wav',role:'production',durationMs:9999},wav);
  assert.equal(a.durationMs,1000);await verifyAssets(id,[a]);
  await assert.rejects(()=>verifyAssets(id,[{...a,durationMs:9000}]),/길이/);
  await assert.rejects(()=>uploadAsset(id,{name:'broken.wav',ext:'wav',role:'reference'},wav.subarray(0,12)));
  const r=await uploadAsset(id,{name:'reference.wav',ext:'wav',role:'reference'},wav);
  const project={scenes:[],music:{assetId:a.id,startMs:0,endMs:1000,offsetMs:0,volume:.12}};
  assert.deepEqual(assetUsage(project,a.id),{sceneIds:[],music:true,used:true});
  assert.equal(assetUsage(project,r.id).used,false);
  assert.deepEqual(assetLibrarySummary([a,r]),{count:2,bytes:wav.length*2,production:1,reference:1});
 }finally{await rm(path.join(root,'public','workspace',id),{recursive:true,force:true});}
});
