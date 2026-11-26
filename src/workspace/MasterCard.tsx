import {useEffect,useState} from 'react';
import {AbsoluteFill,delayRender,continueRender,cancelRender} from 'remotion';
import {EditorialGraphic} from '../engine/EditorialGraphic';
import {SceneMedia} from '../engine/SceneMedia';
import '../engine/fonts';
import type {MasterCardProps} from './master-content';
// The same visual descriptor, renderer, production media and palette as the source scene.
// Static formats reflow the typography and graphic instead of cropping a 9:16 screenshot.
export function MasterCard({entry,theme,size}:MasterCardProps){
 const {scene,asset}=entry,hasGraphic=!!asset||!!scene.visual;
 const [handle]=useState(()=>delayRender('Master card fonts'));
 useEffect(()=>{Promise.all([400,700,900].map(w=>document.fonts.load(w+' 48px "Noto Sans KR"',scene.headline+scene.detail))).then(()=>continueRender(handle),e=>cancelRender(e instanceof Error?e:new Error(String(e))));},[handle,scene.headline,scene.detail]);
 const titleSize=scene.headline.length>48?48:scene.headline.length>24?60:76;
 const fallback=scene.visual?<EditorialGraphic visual={scene.visual} theme={theme} cues={scene.cues} sceneStartMs={scene.startMs} sceneDurationMs={scene.endMs-scene.startMs} layout={scene.layout}/>:null;
 return <AbsoluteFill style={{background:theme.background,color:theme.foreground,fontFamily:'"Noto Sans KR", sans-serif',padding:size==='square'?64:78,display:'flex',flexDirection:'column',gap:24,overflow:'hidden'}}>
  <div style={{fontSize:25,fontWeight:700,color:theme.accent,overflowWrap:'anywhere'}}>{scene.kicker}</div>
  <div style={{fontSize:titleSize,fontWeight:900,lineHeight:1.15,whiteSpace:'pre-line',overflowWrap:'anywhere'}}>{scene.headline}</div>
  {hasGraphic&&<div style={{flex:1,minHeight:0,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}><div style={{width:'100%',maxWidth:size==='square'?650:850}}><SceneMedia scene={scene} asset={asset} fallback={fallback}/></div></div>}
  <div style={{marginTop:hasGraphic?0:'auto',fontSize:scene.detail.length>50?30:38,fontWeight:700,lineHeight:1.35,overflowWrap:'anywhere'}}>{scene.detail}</div>
 </AbsoluteFill>;
}
