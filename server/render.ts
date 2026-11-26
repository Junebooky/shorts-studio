import {bundle} from '@remotion/bundler';import {selectComposition,renderMedia,renderStill,makeCancelSignal} from '@remotion/renderer';import path from 'node:path';import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';import {createHash} from 'node:crypto';import {publishRender,checkCancelled} from './quality/render-output';import {inspectQuality} from './quality';import {fullDecode} from './quality/integrity';import {technicalPass} from '../src/core/quality';import {root,ready} from './storage';import type {Project} from '../src/core/project';
export async function render(p:Project,progress:(n:number)=>void=()=>{},scale=1,signal?:AbortSignal){
 checkCancelled(signal);await ready(p);const out=path.join(root,'out',p.id);await mkdir(out,{recursive:true});
 const outputLocation=path.join(out,'r'+p.revision+(scale===1?'':'-preview')+'.mp4');
 const file=await publishRender(outputLocation,async temporary=>{
  const serveUrl=await bundle({entryPoint:path.join(root,'src/remotion/index.ts'),publicDir:path.join(root,'public')});checkCancelled(signal);
  const inputProps={project:p,safeGuide:false};const composition=await selectComposition({serveUrl,id:'Short',inputProps});checkCancelled(signal);
  const {cancelSignal,cancel}=makeCancelSignal();const abort=()=>cancel();
  signal?.addEventListener('abort',abort,{once:true});
  try{
   checkCancelled(signal);
   await renderMedia({composition,serveUrl,inputProps,codec:'h264',audioCodec:'aac',outputLocation:temporary,scale,cancelSignal,onProgress:({progress:n})=>progress(Math.min(.99,n))});
  }finally{signal?.removeEventListener('abort',abort);}
  if(scale===1){checkCancelled(signal);const q=await inspectQuality(p,temporary,undefined,'final',undefined,file=>fullDecode(file,signal));checkCancelled(signal);if(!technicalPass(q))throw new Error('출력 전 영상 무결성 검사 실패: '+q.checks.filter(c=>c.required&&c.status!=='pass').map(c=>c.detail).join('; '));}
 },signal);
 progress(1);return file;
}
export async function stills(p:Project,outputDir?:string){await ready(p);const out=outputDir??path.join(root,'out',p.id,'qa');await mkdir(out,{recursive:true});const serveUrl=await bundle({entryPoint:path.join(root,'src/remotion/index.ts'),publicDir:path.join(root,'public')});const inputProps={project:p,safeGuide:false};const composition=await selectComposition({serveUrl,id:'Short',inputProps});const marks=new Set([...p.scenes,...p.captions].flatMap(s=>[Math.floor((s.startMs+s.endMs)*.015),Math.floor(s.startMs*.03)+1]).map(frame=>Math.min(composition.durationInFrames-1,Math.max(0,frame))));for(const frame of marks){await renderStill({serveUrl,composition,inputProps,frame:Math.min(composition.durationInFrames-1,Math.max(0,frame)),output:path.join(out,frame+'.png')});}return out;}
