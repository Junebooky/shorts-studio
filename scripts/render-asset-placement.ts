import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {demo,validate,frameAt,type Project} from '../src/core/project';
import {assetPlacementEvidence,assetErrors} from '../src/core/assets';
import {uploadAsset} from '../server/assets';
import {root} from '../server/storage';
const run=promisify(execFile);
const id='asset-placement-fixture',src=path.join(root,'workspace',id),out=path.join(root,'out',id);
await mkdir(out,{recursive:true});
const image=await uploadAsset(id,{name:'wide.png',ext:'png',role:'production'},await readFile(path.join(src,'wide.png')));
const video=await uploadAsset(id,{name:'blocks.mp4',ext:'mp4',role:'production'},await readFile(path.join(src,'blocks.mp4')));
const reference=await uploadAsset(id,{name:'reference.png',ext:'png',role:'reference'},await readFile(path.join(src,'reference.png')));
assert.equal(video.durationMs,4000);
const p:Project={...demo,id,title:'Synthetic placement fixture',styleId:'editorial',durationMs:4000,assets:[image,video,reference],captions:[],scenes:[
 {...demo.scenes[0],id:'image',startMs:0,endMs:2000,headline:'이미지',detail:'소재 비율 유지',media:{assetId:image.id,fit:'contain',offsetMs:0}},
 {...demo.scenes[1],id:'video',startMs:2000,endMs:4000,headline:'영상',detail:'원본 시작 위치 확인',media:{assetId:video.id,fit:'cover',offsetMs:1000}}
]};
assert.deepEqual(validate(p).errors,[]);
const invalid={...p,scenes:p.scenes.map((s,i)=>i===0?{...s,media:{assetId:reference.id,fit:'cover' as const,offsetMs:0}}:s)};
assert.ok(assetErrors(invalid).length>0);
const cover:Project={...p,scenes:p.scenes.map((s,i)=>i===0?{...s,media:{assetId:image.id,fit:'cover' as const,offsetMs:0}}:s)};
const serveUrl=await bundle({entryPoint:path.resolve('src/remotion/index.ts'),publicDir:path.resolve('public')});
const inputProps={project:p,safeGuide:false};
const composition=await selectComposition({serveUrl,id:'Short',inputProps});
const coverComposition=await selectComposition({serveUrl,id:'Short',inputProps:{project:cover,safeGuide:false}});
assert.equal((composition.props.project as Project).scenes[0].media?.fit,'contain');
assert.equal((coverComposition.props.project as Project).scenes[0].media?.fit,'cover');
type Counts={red:number;green:number;blue:number;magenta:number;cyan:number;total:number};
async function colors(file:string,seek?:number):Promise<Counts>{
 const args=['-v','error',...(seek===undefined?[]:['-ss',String(seek)]),'-i',file,'-frames:v','1','-threads','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'];
 const {stdout}=await run('ffmpeg',args,{encoding:'buffer',maxBuffer:16*1024*1024,timeout:30000});
 assert.ok(stdout.length>0&&stdout.length%3===0);
 const c={red:0,green:0,blue:0,magenta:0,cyan:0,total:stdout.length/3};
 for(let i=0;i<stdout.length;i+=3){const r=stdout[i],g=stdout[i+1],b=stdout[i+2];
  if(r>190&&g<65&&b<65)c.red++;
  if(g>160&&r<65&&b<65)c.green++;
  if(b>190&&r<65&&g<65)c.blue++;
  if(r>190&&b>190&&g<65)c.magenta++;
  if(g>170&&b>170&&r<65)c.cyan++;
 }
 return c;
}
const cases=[{name:'image-contain',project:p,ms:1000},{name:'image-cover',project:cover,ms:1000},{name:'video-offset-blue',project:p,ms:2200},{name:'video-offset-green',project:p,ms:3200}];
const evidence:Record<string,Counts>={};
for(const s of cases){
 const file=path.join(out,s.name+'.png');
 await renderStill({serveUrl,composition:s.project===cover?coverComposition:composition,inputProps:{project:s.project,safeGuide:false},frame:frameAt(s.ms),output:file});
 evidence[s.name]=await colors(file);
 assert.equal(evidence[s.name].magenta,0,'reference-only color must not appear');
 console.log(s.name,JSON.stringify(evidence[s.name]));
}
const contain=evidence['image-contain'],cropped=evidence['image-cover'],blue=evidence['video-offset-blue'],green=evidence['video-offset-green'];
assert.ok(contain.cyan>10000&&cropped.cyan>contain.cyan*1.5,'cover should occupy more cyan area than contain');
assert.ok(blue.blue>20000&&blue.red<100&&blue.green<100,'offset must skip first red section');
assert.ok(green.green>20000&&green.red<100&&green.blue<100,'later source frame must show green section');
const mp4=path.join(out,'preview.mp4');
await renderMedia({serveUrl,composition,inputProps,codec:'h264',outputLocation:mp4,scale:.5,concurrency:2});
const decoded={image:await colors(mp4,1),blue:await colors(mp4,2.2),green:await colors(mp4,3.2)};
assert.ok(decoded.image.cyan>2500&&decoded.blue.blue>5000&&decoded.green.green>5000);
for(const sample of Object.values(decoded))assert.ok(sample.magenta<10&&sample.red<100);
await writeFile(path.join(out,'manifest.json'),JSON.stringify({testOnly:true,source:'synthetic flat colors; no user media',placements:assetPlacementEvidence(p),containCoverRatio:cropped.cyan/contain.cyan,stillEvidence:evidence,decodedPreviewEvidence:decoded,scope:'sampled pixel evidence, not semantic or full-frame approval'},null,2));
