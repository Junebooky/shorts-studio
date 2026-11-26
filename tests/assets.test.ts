import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {rm,writeFile} from 'node:fs/promises';import path from 'node:path';import {demo,validate} from '../src/core/project';import {assetErrors,assetUsage,assetLibrarySummary} from '../src/core/assets';import {uploadAsset,verifyAssets,measuredDuration} from '../server/assets';import {root,save} from '../server/storage';
test('asset identity, reference exclusion and byte integrity',async()=>{const id='asset-'+randomUUID();try{const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jDioAAAAASUVORK5CYII=','base64');await assert.rejects(()=>uploadAsset(id,{name:'unsafe.svg',ext:'svg',role:'production'},Buffer.from('<svg/>')));await assert.rejects(()=>uploadAsset(id,{name:'fake.png',ext:'png',role:'production'},Buffer.from('html')));const a=await uploadAsset(id,{name:'image.png',ext:'png',role:'production'},png);const r=await uploadAsset(id,{name:'ref.png',ext:'png',role:'reference'},png);const p={...demo,id,assets:[a,r],scenes:demo.scenes.map((s,i)=>i===0?{...s,media:{assetId:a.id,fit:'contain' as const,offsetMs:0}}:s)};assert.equal(validate(p).errors.length,0);assert.ok(assetErrors({...p,scenes:p.scenes.map(s=>({...s,media:{assetId:r.id,fit:'contain',offsetMs:0}}))}).length);await save(p);await verifyAssets(id,p.assets);await assert.rejects(()=>verifyAssets('other',p.assets));await writeFile(path.join(root,'public',a.path),Buffer.alloc(png.length));await assert.rejects(()=>verifyAssets(id,p.assets));}finally{await rm(path.join(root,'workspace','projects',id),{recursive:true,force:true});await rm(path.join(root,'public','workspace',id),{recursive:true,force:true});}});

test('video and music duration/role limits are checked before rendering',()=>{const id='test',videoId=randomUUID(),audioId=randomUUID(),base={bytes:10,sha256:'a'.repeat(64),name:'fixture',notes:'',role:'production' as const,durationMs:4000};const video={...base,id:videoId,path:'workspace/'+id+'/assets/'+videoId+'.mp4',kind:'video' as const};const audio={...base,id:audioId,path:'workspace/'+id+'/assets/'+audioId+'.wav',kind:'audio' as const};const p={id,durationMs:4000,assets:[video,audio],scenes:[{id:'s',startMs:0,endMs:3000,media:{assetId:videoId,offsetMs:1000,fit:'contain' as const}}],music:{assetId:audioId,startMs:0,endMs:4000,offsetMs:0,volume:.12}};assert.deepEqual(assetErrors(p),[]);assert.ok(assetErrors({...p,scenes:[{...p.scenes[0],endMs:3001}]}).length);assert.ok(assetErrors({...p,music:{...p.music,offsetMs:1}}).length);assert.ok(assetErrors({...p,assets:[video,{...audio,role:'reference'}]}).length);});
import {pcmToWav} from '../server/elevenlabs';
test('media probe rejects audio-only MP4 and attached cover art, uses conservative duration',()=>{
 const format={format_name:'mov,mp4,m4a,3gp,3g2,mj2',duration:'3.500'};
 assert.equal(measuredDuration({format,streams:[{codec_type:'video',duration:'3.250'}]},'mp4'),3250);
 assert.throws(()=>measuredDuration({format,streams:[{codec_type:'audio',duration:'3.5'}]},'mp4'));
 assert.throws(()=>measuredDuration({format,streams:[{codec_type:'video',disposition:{attached_pic:1}}]},'mp4'));
 assert.throws(()=>measuredDuration({format:{format_name:'wav',duration:'N/A'},streams:[{codec_type:'audio'}]},'wav'));
 assert.throws(()=>measuredDuration({format:{format_name:'mp3',duration:'3'},streams:[{codec_type:'audio'}]},'wav'));
});
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
