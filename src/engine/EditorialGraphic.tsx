import React from 'react';
import {interpolate,useCurrentFrame,useVideoConfig,spring} from 'remotion';
import {SemanticGraphic} from './SemanticGraphic';
import type {Visual} from '../core/visual';
import {cueFrame,type Cue} from '../core/motion-cues';
import {preset,type StyleId} from '../core/styles';
import type {Project} from '../core/project';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
export function EditorialGraphic({visual,theme,cues=[],sceneStartMs=0,sceneDurationMs=4000,styleId}:{visual:Visual;theme:Project['theme'];cues?:Cue[];sceneStartMs?:number;sceneDurationMs?:number;styleId?:StyleId}){
 const f=useCurrentFrame(),{fps}=useVideoConfig(),p=spring({frame:f,fps,config:{damping:22,stiffness:95}});
 const profile=preset(styleId);const reveal=profile?.revealFrames??12;const offset=(i:number)=>{const c=cues.find(x=>x.slot===i);return c?cueFrame(c,sceneStartMs,fps):i*(profile?.staggerFrames??8);};
 const appear=(i:number)=>interpolate(f,[offset(i)-1,offset(i)+reveal-1],[0,1],clamp);
 const ink=theme.foreground,accent=theme.accent;
 const caption=(text:string,x:number,y:number,size=32,color=ink)=><text x={x} y={y} fill={color} fontSize={size} fontWeight={700} textAnchor="middle">{text}</text>;
 if(visual.type==='mechanism'||visual.type==='semiconductor')return <SemanticGraphic visual={visual} theme={theme} cues={cues} sceneStartMs={sceneStartMs} sceneDurationMs={sceneDurationMs}/>;
 return <svg width="100%" viewBox="0 0 800 480" aria-hidden="true" style={{display:'block',overflow:'visible'}}>
 {visual.type==='path'&&(()=>{
 const mode=profile?.layout;const positions=mode==='data'?[[130,240],[400,240],[670,240]]:mode==='kinetic'?[[130,348],[400,235],[670,120]]:mode==='minimal'?[[130,280],[400,240],[670,200]]:[[110,355],[400,245],[690,120]];
 const route=mode==='data'?'M130 240 H670':mode==='kinetic'?'M130 348 L400 235 L670 120':mode==='minimal'?'M130 280 L400 240 L670 200':'M110 355 C245 355 220 245 400 245 S555 120 690 120';
 const draw=cues.length?Math.max(appear(0),appear(1),appear(2)):Math.min(1,p);
 return <>{mode==='data'&&<><path d="M55 180 H745 M55 300 H745" stroke={accent} strokeDasharray="4 8" opacity=".12"/><path d="M265 230 L275 240 L265 250 M535 230 L545 240 L535 250" stroke={accent} strokeWidth={5} fill="none"/></>}{mode==='cinematic'&&<path d={route} stroke={accent} strokeWidth={28} opacity={.10*draw} fill="none" strokeLinecap="round"/>}<path d={route} fill="none" stroke={accent} strokeWidth={(mode==='illustrated'?13:mode==='minimal'?3:8)*(profile?.strokeScale??1)} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-draw}/>
 {visual.labels.map((l,i)=>{const [x,y]=positions[i],alpha=appear(i);const scale=mode==='illustrated'?(.7+.3*alpha):1;return <g key={i} opacity={alpha} transform={'translate('+x+' '+y+') scale('+scale+')'}>
 {mode==='data'?<><rect x={-86} y={-38} width={172} height={76} rx={16} fill={theme.background} stroke={accent} strokeWidth={3}/>{caption(l,0,10,28)}</>:mode==='kinetic'?<><rect x={-24} y={-24} width={48} height={48} rx={7} fill={accent} transform="rotate(45)"/>{caption(l,0,i===0?74:-48,32,accent)}</>:mode==='illustrated'?<><circle r={38} fill={theme.background} stroke={accent} strokeWidth={9}/>{i===0?<path d="M-13 0 H13 M0 -13 V13" stroke={accent} strokeWidth={7} strokeLinecap="round"/>:i===1?<path d="M-14 8 L-5 18 L18 -15" stroke={accent} strokeWidth={7} fill="none" strokeLinecap="round"/>:<><circle r={12} fill={accent}/><circle r={25} fill="none" stroke={accent} strokeWidth={3}/></>}{caption(l,0,i===0?88:-60,30)}</>:<>{mode==='cinematic'&&<circle r={45} fill={accent} opacity=".12"/>}<circle r={mode==='minimal'?10:27} fill={theme.background} stroke={accent} strokeWidth={mode==='minimal'?3:7*(profile?.strokeScale??1)}/>{mode!=='minimal'&&<circle r={9} fill={accent}/>} {caption(l,0,i===0?65:-48,27)}</>}
 </g>;})}</>;
 })()}
 {visual.type==='contrast'&&<>{[visual.left,visual.right].map((l,i)=><g key={i} opacity={appear(i)}><rect x={48+i*370} y={75} width={334} height={330} rx={28} fill={accent} opacity={i?.16:.06}/>{i===0?<g stroke={ink} strokeWidth={4} opacity=".75">{[0,1,2,3,4].map(k=><rect key={k} x={115+k*15} y={119+k*18} width={173-k*18} height={145-k*10} rx={7} fill={theme.background}/>)}</g>:<><circle cx={585} cy={225} r={82*Math.max(.01,appear(1))} fill={accent}/><path d="M548 225 L577 254 L629 198" stroke={theme.background} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>}{caption(l,215+i*370,360,35)}</g>)}<path d="M390 240 H410 M400 230 L410 240 L400 250" stroke={accent} strokeWidth={4} fill="none"/></>}
 {visual.type==='cycle'&&<><circle cx={400} cy={238} r={135} fill="none" stroke={accent} strokeWidth={5*(profile?.strokeScale??1)} strokeDasharray="8 12" opacity=".5"/><path d="M400 103 A135 135 0 1 1 272 280" fill="none" stroke={accent} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-Math.min(1,p)}/>{visual.labels.map((l,i)=>{const a=-Math.PI/2+i*2*Math.PI/3,x=400+135*Math.cos(a),y=238+135*Math.sin(a);return <g key={i} opacity={appear(i)}><circle cx={x} cy={y} r={48} fill={theme.background} stroke={accent} strokeWidth={5}/>{caption(String(i+1),x,y+12,34,accent)}{caption(l,x,y+(i===0?-65:86),30)}</g>})}</>}
 {visual.type==='focus'&&<><rect x={60} y={100} width={680} height={278} rx={32} fill={accent} opacity=".1"/><path d="M100 145 H170 M100 145 V205 M700 333 H630 M700 333 V273" stroke={accent} strokeWidth={8} fill="none" strokeLinecap="round"/><g opacity={appear(0)} transform={'translate(400 250) scale('+(.85+.15*p)+')'}>{caption(visual.word,0,24,visual.word.length>7?51:76,accent)}</g><rect x={210} y={310} width={380*appear(0)} height={7} rx={3} fill={accent}/></>}
 {visual.type==='typography'&&<><g opacity={appear(0)} transform={'translate(0 '+((1-p)*20)+')'}>{caption(visual.lines[0],400,180,visual.lines[0].length>7?56:76,ink)}</g><rect x={130} y={228} width={540*Math.min(1,p)} height={6} rx={3} fill={accent}/><g opacity={appear(1)}>{caption(visual.lines[1],400,333,visual.lines[1].length>7?60:84,accent)}</g></>}
 </svg>;
}
