import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import {demo,FPS,frameAt,frames,validate,type Project} from '../src/core/project';
import {alignTranscript,type TranscriptSegment} from '../src/core/timing';
import {compileStoryboard,type Storyboard} from '../src/core/storyboard';
import {cueFrame,assertResolvedCues} from '../src/core/motion-cues';
import {PRESETS,type StyleId} from '../src/core/styles';
import {assertRequestInputs} from '../src/core/task-inputs';
import {audioUpload,root} from '../server/storage';
const run=promisify(execFile);
const id='speech-cue-fixture',src=path.join(root,'workspace',id),out=path.join(root,'out',id);
await mkdir(out,{recursive:true});
const fixture=JSON.parse(await readFile(path.join(src,'metadata.json'),'utf8')) as {script:string;durationMs:number;words:{text:string;startMs:number;endMs:number}[];source:string};
assert.equal(fixture.words.length,4);
assert.equal(fixture.words[2].text,fixture.words[3].text);
const audio=await audioUpload(id,'wav',await readFile(path.join(src,'voice.wav')));
const segments:TranscriptSegment[]=[[fixture.words[0]],fixture.words.slice(1)].map(words=>({text:words.map(w=>w.text).join(' '),startMs:words[0].startMs,endMs:words[words.length-1].endMs,words}));
const aligned=alignTranscript({script:fixture.script,audio,durationMs:fixture.durationMs,source:'whisper',segments});
assert.equal(aligned.analysis.status,'matched');
const initial:Project={...demo,id,title:'Synthetic cue verification',script:fixture.script,audio,durationMs:fixture.durationMs,...aligned,timingSource:'whisper',scenes:[]};
const serveUrl=await bundle({entryPoint:path.resolve('src/remotion/index.ts'),publicDir:path.resolve('public')});
async function pixels(file:string){
 const {stdout}=await run('ffmpeg',['-v','error','-i',file,'-frames:v','1','-threads','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{encoding:'buffer',maxBuffer:16*1024*1024,timeout:30000});
 assert.equal(stdout.length,1080*1920*3);return stdout;
}
function pixelDiff(a:Buffer,b:Buffer){let changed=0,maxDelta=0;for(let i=0;i<a.length;i+=3){const d=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));if(d>2)changed++;maxDelta=Math.max(d,maxDelta);}return {changed,maxDelta};}
const evidence=[];
for(const styleId of ['auto','kinetic'] as const satisfies readonly StyleId[]){
 const p={...initial,styleId};
 const make=(wordIndex:number):Project=>{
  const board:Storyboard={version:1,projectId:id,baseRevision:p.revision,styleId,theme:demo.theme,direction:{concept:'선택',audience:'일반',style:'테스트',author:'fixture'},beats:[
   {captionIds:['cap-0'],purpose:'준비',metaphor:'준비',headline:'준비',kicker:'01',detail:'준비',visual:{type:'focus',word:'준비'}},
   {captionIds:['cap-1'],purpose:'같은 어절의 다른 시점',metaphor:'선택 강조',headline:'선택',kicker:'02',detail:'선택의 순간',visual:{type:'focus',word:'선택'},cues:[{slot:0,wordIndex,expectedWord:'선택'}]}
  ]};
  const q=compileStoryboard(p,board);assert.deepEqual(validate(q).errors,[]);assertRequestInputs(p,q);
  const s=q.scenes[1];assertResolvedCues(s.cues!,s.visual!,q.analysis,s.startMs,s.endMs,FPS);return q;
 };
 const early=make(2),late=make(3),scene=early.scenes[1],sceneFrame=frameAt(scene.startMs);
 const first=frameAt(fixture.words[2].startMs),second=frameAt(fixture.words[3].startMs);
 assert.equal(scene.startMs,fixture.words[1].startMs);assert.ok(sceneFrame>0&&first>sceneFrame);
 assert.equal(cueFrame(scene.cues![0],scene.startMs,FPS),first-sceneFrame);
 const reveal=styleId==='auto'?12:PRESETS.kinetic.revealFrames;
 const samples=[{name:'before',frame:first-1,expectDifference:false},{name:'onset',frame:first,expectDifference:true},{name:'early-settled',frame:first+reveal,expectDifference:true},{name:'both-settled',frame:second+reveal,expectDifference:false}];
 assert.ok(first+reveal<second);assert.ok(second+reveal<frames(early));
 const inputProps={project:early,safeGuide:false};
 const composition=await selectComposition({serveUrl,id:'Short',inputProps});
 const results=[];
 for(const sample of samples){
  const files=[];
  for(const [variant,project] of [['early',early],['late',late]] as const){
   const output=path.join(out,styleId+'-'+sample.name+'-'+variant+'.png');
   await renderStill({serveUrl,composition,inputProps:{project,safeGuide:false},frame:sample.frame,output});
   files.push(output);
  }
  const diff=pixelDiff(await pixels(files[0]),await pixels(files[1]));
  const result={...sample,...diff,files:files.map(f=>path.basename(f))};
  results.push(result);
  console.log(styleId,JSON.stringify(result));
  // Compare two counterfactuals at exactly the same absolute frame. A tiny
  // pixel tolerance absorbs possible rasterization noise, not cue delays.
  if(sample.expectDifference)assert.ok(diff.changed>=25,styleId+' '+sample.name+' should visibly differ');
  else assert.ok(diff.changed<=5,styleId+' '+sample.name+' should match');
 }
 if(styleId==='kinetic')await renderMedia({serveUrl,composition,inputProps,codec:'h264',outputLocation:path.join(out,'speech-cue-preview.mp4'),scale:.5,concurrency:2});
 evidence.push({styleId,sceneStartMs:scene.startMs,sceneFrame,earlyWord:fixture.words[2],lateWord:fixture.words[3],earlyFrame:first,lateFrame:second,revealFrames:reveal,results});
}
await writeFile(path.join(out,'manifest.json'),JSON.stringify({source:fixture.source,testOnly:true,fps:FPS,durationMs:fixture.durationMs,sourceWords:fixture.words,scope:'pixel difference between early/late valid repeated-word anchors; not perceptual or semantic approval',evidence},null,2));
