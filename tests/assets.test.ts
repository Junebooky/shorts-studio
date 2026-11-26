import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {rm,writeFile} from 'node:fs/promises';import path from 'node:path';import {demo,validate,FPS} from '../src/core/project';import {assetErrors,assetUsage,assetLibrarySummary,placementFrameBudget,assetPlacementEvidence,ASSET_PLACEMENT_FPS} from '../src/core/assets';import {uploadAsset,verifyAssets,measuredDuration} from '../server/assets';import {root,save} from '../server/storage';
test('asset identity, reference exclusion and byte integrity',async()=>{const id='asset-'+randomUUID();try{const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jDioAAAAASUVORK5CYII=','base64');await assert.rejects(()=>uploadAsset(id,{name:'unsafe.svg',ext:'svg',role:'production'},Buffer.from('<svg/>')));await assert.rejects(()=>uploadAsset(id,{name:'fake.png',ext:'png',role:'production'},Buffer.from('html')));const a=await uploadAsset(id,{name:'image.png',ext:'png',role:'production'},png);const r=await uploadAsset(id,{name:'ref.png',ext:'png',role:'reference'},png);const p={...demo,id,assets:[a,r],scenes:demo.scenes.map((s,i)=>i===0?{...s,media:{assetId:a.id,fit:'contain' as const,offsetMs:0}}:s)};assert.equal(validate(p).errors.length,0);assert.ok(assetErrors({...p,scenes:p.scenes.map(s=>({...s,media:{assetId:r.id,fit:'contain',offsetMs:0}}))}).length);await save(p);await verifyAssets(id,p.assets);await assert.rejects(()=>verifyAssets('other',p.assets));await writeFile(path.join(root,'public',a.path),Buffer.alloc(png.length));await assert.rejects(()=>verifyAssets(id,p.assets));}finally{await rm(path.join(root,'workspace','projects',id),{recursive:true,force:true});await rm(path.join(root,'public','workspace',id),{recursive:true,force:true});}});

test('video and music duration/role limits are checked before rendering',()=>{const id='test',videoId=randomUUID(),audioId=randomUUID(),base={bytes:10,sha256:'a'.repeat(64),name:'fixture',notes:'',role:'production' as const,durationMs:4000};const video={...base,id:videoId,path:'workspace/'+id+'/assets/'+videoId+'.mp4',kind:'video' as const};const audio={...base,id:audioId,path:'workspace/'+id+'/assets/'+audioId+'.wav',kind:'audio' as const};const p={id,durationMs:4000,assets:[video,audio],scenes:[{id:'s',startMs:0,endMs:3000,media:{assetId:videoId,offsetMs:1000,fit:'contain' as const}}],music:{assetId:audioId,startMs:0,endMs:4000,offsetMs:0,volume:.12}};assert.deepEqual(assetErrors(p),[]);assert.ok(assetErrors({...p,scenes:[{...p.scenes[0],endMs:3001}]}).length);assert.ok(assetErrors({...p,music:{...p.music,offsetMs:1}}).length);assert.ok(assetErrors({...p,assets:[video,{...audio,role:'reference'}]}).length);});
test('media probe rejects audio-only MP4 and attached cover art, uses conservative duration',()=>{
 const format={format_name:'mov,mp4,m4a,3gp,3g2,mj2',duration:'3.500'};
 assert.equal(measuredDuration({format,streams:[{codec_type:'video',duration:'3.250'}]},'mp4'),3250);
 assert.throws(()=>measuredDuration({format,streams:[{codec_type:'audio',duration:'3.5'}]},'mp4'));
 assert.throws(()=>measuredDuration({format,streams:[{codec_type:'video',disposition:{attached_pic:1}}]},'mp4'));
 assert.throws(()=>measuredDuration({format:{format_name:'wav',duration:'N/A'},streams:[{codec_type:'audio'}]},'wav'));
 assert.throws(()=>measuredDuration({format:{format_name:'mp3',duration:'3'},streams:[{codec_type:'audio'}]},'wav'));
});

test('asset usage summary separates references and placement without changing metadata',()=>{
 const id=randomUUID(),a={id,path:'workspace/test/assets/'+id+'.wav',name:'fixture',kind:'audio' as const,role:'production' as const,durationMs:1000,bytes:48044,sha256:'a'.repeat(64),notes:''};
 const r={...a,id:randomUUID(),role:'reference' as const};
 const p={scenes:[],music:{assetId:id,startMs:0,endMs:1000,offsetMs:0,volume:.12}};
 assert.deepEqual(assetUsage(p,id),{sceneIds:[],music:true,used:true});
 assert.equal(assetUsage(p,r.id).used,false);assert.deepEqual(assetLibrarySummary([a,r]),{count:2,bytes:96088,production:1,reference:1});assert.equal(r.role,'reference');
});

test('frame quantization cannot read past a source despite a valid millisecond interval',()=>{
 assert.equal(ASSET_PLACEMENT_FPS,FPS);
 assert.equal(placementFrameBudget(0,999,1,1000).fits,false);
 assert.equal(placementFrameBudget(0,999,0,1000).fits,true);
 assert.equal(placementFrameBudget(1,1000,1,1000).fits,true);
 assert.deepEqual(placementFrameBudget(2000,4000,1000,4000),{startFrame:60,endFrame:120,sourceStartFrame:30,frameCount:60,sourceEndFrameExclusive:90,availableSourceFrames:120,fits:true});
 const id='test',assetId=randomUUID(),a={id:assetId,path:'workspace/test/assets/'+assetId+'.mp4',name:'fixture',kind:'video' as const,role:'production' as const,bytes:10,sha256:'a'.repeat(64),durationMs:1000,notes:''};
 const p={id,durationMs:1000,assets:[a],scenes:[{id:'scene',startMs:0,endMs:999,media:{assetId,fit:'cover' as const,offsetMs:1}}]};
 assert.ok(assetErrors(p).some(e=>e.includes('프레임 범위')));
 const audio={...a,kind:'audio' as const,path:'workspace/test/assets/'+assetId+'.wav'};
 assert.ok(assetErrors({...p,assets:[audio],scenes:[],music:{assetId,startMs:0,endMs:999,offsetMs:1,volume:.12}}).some(e=>e.includes('프레임 범위')));
});
test('placement evidence distinguishes graphics, valid assets, references and replaced cue advisory',()=>{
 const id=randomUUID(),refId=randomUUID(),a={id,path:'workspace/test/assets/'+id+'.png',name:'fixture',kind:'image' as const,role:'production' as const,bytes:10,sha256:'a'.repeat(64),notes:''};
 const r={...a,id:refId,role:'reference' as const};
 const scenes=[{id:'s1',startMs:0,endMs:1000},{id:'s2',startMs:1000,endMs:2000,media:{assetId:id,fit:'contain' as const,offsetMs:0},cues:[{}]},{id:'s3',startMs:2000,endMs:3000,media:{assetId:refId,fit:'cover' as const,offsetMs:0}}];
 const e=assetPlacementEvidence({assets:[a,r],scenes});
 assert.deepEqual(e.scenePlacements.map(s=>s.status),['graphic','image','invalid']);
 assert.equal(e.scenePlacements[1].graphicCuesReplaced,true);assert.equal(e.scenePlacements[2].graphicCuesReplaced,false);
 assert.deepEqual(e.referenceIds,[refId]);
});
