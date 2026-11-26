import React,{useLayoutEffect,useRef} from 'react';
import {AbsoluteFill,Composition,continueRender,delayRender,registerRoot,useCurrentFrame} from 'remotion';
import {Short} from '../../src/engine/Short';
import {demo,FPS,frames,type Project} from '../../src/core/project';
import type {LayoutSample,Rect} from '../../src/core/quality/layout';
import {inspectTextAppearance} from './text-appearance';
const PREFIX='SHORTS_LAYOUT_QA:';
function rect(r:DOMRect,origin:DOMRect):Rect{return {left:r.left-origin.left,top:r.top-origin.top,right:r.right-origin.left,bottom:r.bottom-origin.top};}
function sample(root:HTMLDivElement,frame:number):LayoutSample{
 const origin=root.getBoundingClientRect();
 const elements:LayoutSample['elements']=[];
 for(const el of root.querySelectorAll<HTMLElement>('[data-critical]')){
  if(!el.getClientRects().length)continue;
  let visible=true;
  let clip:Rect|null=null;
  for(let node:HTMLElement|null=el;node;node=node.parentElement){
   const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0){visible=false;break;}
   const x=/hidden|clip|scroll|auto/.test(style.overflowX),y=/hidden|clip|scroll|auto/.test(style.overflowY);
   if(x||y){const r=rect(node.getBoundingClientRect(),origin);const prev:Rect=clip??{left:-100000,top:-100000,right:100000,bottom:100000};
    clip={left:x?Math.max(prev.left,r.left+node.clientLeft):prev.left,top:y?Math.max(prev.top,r.top+node.clientTop):prev.top,right:x?Math.min(prev.right,r.left+node.clientLeft+node.clientWidth):prev.right,bottom:y?Math.min(prev.bottom,r.top+node.clientTop+node.clientHeight):prev.bottom};
   }if(node===root)break;
  }
  if(!visible)continue;
  const rects:Rect[]=[];const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
  for(let node=walker.nextNode();node;node=walker.nextNode()){
   if(!node.textContent?.trim())continue;
   const range=document.createRange();range.selectNodeContents(node);
   for(const r of range.getClientRects())if(r.width>0&&r.height>0)rects.push(rect(r,origin));
  }
  if(clip&&(clip.right<=clip.left||clip.bottom<=clip.top))clip={left:-2,top:-2,right:-1,bottom:-1};
  if(rects.length)elements.push({role:el.dataset.critical||'text',rects,clip,appearance:inspectTextAppearance(el,root)});
 }
 return {frame,elements};
}
function LayoutShort({project}:{project:Project}){
 const root=useRef<HTMLDivElement>(null),frame=useCurrentFrame();
 useLayoutEffect(()=>{
  const handle=delayRender('Measure sampled critical text bounds');let active=true;
  void (async()=>{try{
    await Promise.all([400,700,900].map(w=>document.fonts.load(w+' 48px "Noto Sans KR"','한글 자막')));
    await document.fonts.ready;
    if(active&&root.current)console.log(PREFIX+JSON.stringify(sample(root.current,frame)));
   }catch{/* Missing evidence is handled by server QA. */}finally{if(active){active=false;continueRender(handle);}}})();
  return()=>{if(active){active=false;continueRender(handle);}};
 },[frame]);
 return <AbsoluteFill ref={root}><Short project={project} safeGuide={false}/></AbsoluteFill>;
}
function Root(){return <Composition id="ShortQA" component={LayoutShort} width={1080} height={1920} fps={FPS} durationInFrames={frames(demo)} defaultProps={{project:demo}} calculateMetadata={({props})=>({durationInFrames:frames(props.project)})}/>;}
registerRoot(Root);
