import {bundle} from '@remotion/bundler';import {selectComposition,renderMedia,renderStill,makeCancelSignal} from '@remotion/renderer';import path from 'node:path';import {mkdir,readFile,writeFile,rm} from 'node:fs/promises';import {createHash} from 'node:crypto';import {publishRender,checkCancelled} from './quality/render-output';import {LayoutSample} from '../src/core/quality/layout';import {root,ready} from './storage';import type {Project} from '../src/core/project';
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
 },signal);
 progress(1);return file;
}
export async function stills(p:Project,outputDir?:string,signal?:AbortSignal){
 checkCancelled(signal);await ready(p);const out=outputDir??path.join(root,'out',p.id,'qa');await mkdir(out,{recursive:true});
 const serveUrl=await bundle({entryPoint:path.join(root,'server/quality/layout-entry.tsx'),publicDir:path.join(root,'public')});
 checkCancelled(signal);const composition=await selectComposition({serveUrl,id:'ShortQA',inputProps:{project:p}});
 const marks=new Set([...p.scenes,...p.captions].flatMap(s=>[Math.floor((s.startMs+s.endMs)*.015),Math.floor(s.startMs*.03)+1]).map(frame=>Math.min(composition.durationInFrames-1,Math.max(0,frame))));
 marks.add(0);marks.add(composition.durationInFrames-1);
 for(const frame of marks){
  checkCancelled(signal);
  const output=path.join(out,frame+'.png'),sidecar=path.join(out,frame+'.layout.json');
  await rm(sidecar,{force:true});
  let evidence:LayoutSample|undefined;const prefix='SHORTS_LAYOUT_QA:';
  await renderStill({serveUrl,composition,inputProps:{project:p},frame,output,imageFormat:'png',onBrowserLog:({text})=>{
   if(!text.startsWith(prefix))return;
   try{const parsed=LayoutSample.safeParse(JSON.parse(text.slice(prefix.length)));if(parsed.success&&parsed.data.frame===frame)evidence=parsed.data;}catch{/* unavailable */}
  }});
  checkCancelled(signal);if(evidence){const sha256=createHash('sha256').update(await readFile(output)).digest('hex');await writeFile(sidecar,JSON.stringify({sha256,sample:evidence}));}
 }
 checkCancelled(signal);return out;
}
