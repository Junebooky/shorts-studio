import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile,writeFile,mkdir,copyFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {demo,validate,type Project} from '../src/core/project';
import {alignTranscript,isCurrent} from '../src/core/timing';
import {audioUpload,load,save,root} from '../server/storage';
import {uploadAsset,verifyAssets} from '../server/assets';
import {exportPackage,restorePackage,decodePackage} from '../server/project-package';
import {approveVoice,productionState} from '../server/production';
import {render,stills} from '../server/render';
import {inspectQuality} from '../server/quality';
import {technicalPass} from '../src/core/quality';
const id='package-media-'+randomUUID(),input=path.join(root,'workspace','package-fixture'),out=path.join(root,'out','package-integration');
let restored:string|undefined;
try{
 const voice=await readFile(path.join(input,'tone.wav'));
 const audio=await audioUpload(id,'wav',voice);
 const video=await uploadAsset(id,{name:'clip.mp4',ext:'mp4',role:'production',durationMs:9999},await readFile(path.join(input,'clip.mp4')));
 const music=await uploadAsset(id,{name:'music.wav',ext:'wav',role:'production',durationMs:9999},voice);
 const reference=await uploadAsset(id,{name:'ref.png',ext:'png',role:'reference'},await readFile(path.join(input,'ref.png')));
 assert.equal(video.durationMs,4000);assert.equal(music.durationMs,4000);
 const script='테스트 음성입니다.',durationMs=4000;
 const timing=alignTranscript({script,audio,durationMs,source:'srt',segments:[{text:script,startMs:200,endMs:3800}]});
 const p:Project=await save({...demo,id,revision:0,script,audio,durationMs,...timing,timingSource:'srt',styleId:'editorial',assets:[video,music,reference],referenceBrief:'합성 참고 자료',scenes:[{...demo.scenes[0],id:'video',startMs:0,endMs:4000,media:{assetId:video.id,fit:'contain',offsetMs:0}}],music:{assetId:music.id,startMs:0,endMs:4000,offsetMs:0,volume:.12}});
 assert.deepEqual(validate(p).errors,[]);await approveVoice(id,p.revision,'Synthetic fixture only; not a listening review');
 const bytes=await exportPackage(id,p.revision);assert.equal(decodePackage(bytes).files.size,4);
 const q=await restorePackage(bytes);restored=q.id;assert.notEqual(q.id,id);assert.ok(isCurrent(q.analysis,q));assert.deepEqual(q.captions,p.captions);assert.deepEqual(q.scenes,p.scenes);assert.deepEqual(q.music,p.music);assert.equal(q.styleId,p.styleId);
 await verifyAssets(q.id,q.assets);for(const a of q.assets??[]){const src=p.assets!.find(x=>x.id===a.id)!;assert.equal(a.durationMs,src.durationMs);assert.deepEqual(await readFile(path.join(root,'public',a.path)),await readFile(path.join(root,'public',src.path)));}
 assert.deepEqual(await readFile(path.join(root,'public',q.audio!)),voice);assert.equal((await productionState(q)).voiceApproved,false);assert.deepEqual(await load(id),JSON.parse(JSON.stringify(p)));
 const file=await render(q,()=>{},.5),dir=await stills(q);const quality=await inspectQuality(q,file,dir,'preview');assert.ok(technicalPass(quality),JSON.stringify(quality));
 await mkdir(out,{recursive:true});await copyFile(file,path.join(out,'restored.mp4'));await writeFile(path.join(out,'report.json'),JSON.stringify({testFixture:true,packageBytes:bytes.length,files:4,videoDurationMs:video.durationMs,musicDurationMs:music.durationMs,sourcePreserved:true,approvalReset:true,restoredRender:quality},null,2));console.log('Real media backup, restore and re-render passed');
}finally{for(const x of [id,restored].filter(Boolean) as string[])for(const d of [path.join(root,'public','workspace',x),path.join(root,'workspace','projects',x),path.join(root,'out',x)])await rm(d,{recursive:true,force:true});}
