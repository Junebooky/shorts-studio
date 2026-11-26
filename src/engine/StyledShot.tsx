import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig,interpolate,spring} from 'remotion';
import {SAFE,type SceneData,type Project} from '../core/project';
import {preset,type PresetId} from '../core/styles';
import {SceneMedia} from './SceneMedia';import type {Asset} from '../core/assets';
import {EditorialGraphic} from './EditorialGraphic';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
export function StyledShot({scene,theme,styleId,fallback,asset}:{scene:SceneData;theme:Project['theme'];styleId:PresetId;fallback:React.ReactNode;asset?:Asset}){
 const profile=preset(styleId)!;const f=useCurrentFrame(),{fps}=useVideoConfig(),layout=profile.layout;
 const progress=interpolate(f,[0,profile.revealFrames],[0,1],clamp);
 const smooth=spring({frame:f,fps,config:{damping:layout==='illustrated'?12:24,stiffness:layout==='kinetic'?180:85}});
 const ink=theme.foreground,accent=theme.accent;
 const center=layout==='minimal'||layout==='cinematic'||layout==='illustrated'||layout==='kinetic';
 const headlineSize=scene.headline.replace(/\n/g,'').length>25?Math.min(62,profile.headlineSize):scene.headline.replace(/\n/g,'').length>16?Math.min(78,profile.headlineSize):profile.headlineSize;
 const graphic=<div style={{width:'100%',maxWidth:layout==='minimal'?640:780,alignSelf:'center',flexShrink:0,transform:layout==='cinematic'?'scale('+(.91+.09*progress)+')':layout==='illustrated'?'translateY('+((1-smooth)*30)+'px)':'none',...(layout==='data'?{background:'#FFFFFF',borderRadius:28,padding:'12px 0',boxShadow:'0 12px 36px #163A6B14'}:{})}}><SceneMedia scene={scene} asset={asset} fallback={scene.visual?<EditorialGraphic visual={scene.visual} theme={theme} cues={scene.cues} sceneStartMs={scene.startMs} sceneDurationMs={scene.endMs-scene.startMs} styleId={styleId}/>:fallback}/></div>;
 return <AbsoluteFill data-style-layout={layout} style={{color:ink}}>
 {layout==='data'&&<AbsoluteFill style={{backgroundImage:'linear-gradient('+accent+'12 1px, transparent 1px),linear-gradient(90deg,'+accent+'12 1px, transparent 1px)',backgroundSize:'72px 72px'}}/>}
 {layout==='cinematic'&&<AbsoluteFill style={{background:'radial-gradient(ellipse at 35% 35%, '+accent+'29, transparent 55%)'}}/>}
 {layout==='illustrated'&&<AbsoluteFill><div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:accent+'0C',top:180,left:-290}}/><div style={{position:'absolute',width:480,height:480,borderRadius:'50%',background:accent+'12',right:-200,bottom:460}}/></AbsoluteFill>}
 <AbsoluteFill style={{left:SAFE.left+20,right:SAFE.right+20,width:'auto',top:SAFE.top+32,bottom:SAFE.bottom+175,height:'auto',display:'flex',flexDirection:'column',justifyContent:layout==='data'?'flex-start':'center',gap:layout==='minimal'?34:24,textAlign:center?'center':'left',paddingTop:layout==='data'?34:0}}>
 <div style={{fontSize:26,fontWeight:700,letterSpacing:layout==='kinetic'?1:3,color:accent,display:'flex',justifyContent:center?'center':'space-between',alignItems:'center',gap:14}}>{scene.kicker}{layout==='editorial'&&<span style={{flex:1,height:2,background:accent,opacity:.45}}/>}</div>
 {layout==='cinematic'&&graphic}
 <div data-critical="headline" style={{fontSize:headlineSize,fontWeight:layout==='minimal'?700:900,lineHeight:1.15,letterSpacing:layout==='kinetic'?-5:-2,whiteSpace:'pre-line',wordBreak:'keep-all',overflowWrap:'anywhere',flexShrink:0,transform:'translateY('+((1-progress)*(layout==='kinetic'?52:18))+'px)',opacity:.78+.22*progress}}>{scene.headline}</div>
 {layout==='kinetic'&&<div style={{height:8,width:(60+40*progress)+'%',background:accent,alignSelf:'center',borderRadius:4}}/>}
 {layout!=='cinematic'&&graphic}
 <div data-critical="detail" style={{fontSize:layout==='minimal'?32:35,fontWeight:layout==='kinetic'?900:700,lineHeight:1.32,color:layout==='editorial'||layout==='data'?ink:accent,wordBreak:'keep-all',overflowWrap:'anywhere'}}>{scene.detail}</div>
 </AbsoluteFill>
 </AbsoluteFill>;
}
