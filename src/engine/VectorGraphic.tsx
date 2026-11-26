import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import type {VectorVisual} from '../core/vector-motion';
import type {Project} from '../core/project';
import {cueFrame,type Cue} from '../core/motion-cues';
export function vectorProgress(frame:number,start:number,end:number){const t=Math.max(0,Math.min(1,(frame-start)/Math.max(1,end-start)));return t*t*(3-2*t);}
export function VectorGraphic({visual,theme,cues=[],sceneStartMs,sceneDurationMs}:{visual:VectorVisual;theme:Project['theme'];cues?:Cue[];sceneStartMs:number;sceneDurationMs:number}){
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),end=Math.max(1,Math.ceil(sceneDurationMs*fps/1000)-1);
 return <VectorGraphicState visual={visual} theme={theme} progress={slot=>{const cue=cues.find(c=>c.slot===slot);if(!cue)return 1;const start=cueFrame(cue,sceneStartMs,fps);return vectorProgress(frame,start,Math.min(end,start+Math.max(8,Math.ceil(fps*.65))));}}/>;
}
export function VectorGraphicState({visual,theme,progress=()=>1}:{visual:VectorVisual;theme:Project['theme'];progress?:(slot:number)=>number}){
 const colors={...theme,muted:theme.foreground,none:'none'};
 return <svg data-vector-subject={visual.subject} width="100%" viewBox="0 0 800 480" aria-hidden="true" style={{display:'block',overflow:'hidden'}}>
 {visual.layers.map(l=>{const m=l.motion,t=m?progress(m.slot):1,transform=m?.kind==='translate'?'translate('+m.dx*(1-t)+' '+m.dy*(1-t)+')':m?.kind==='rotate'?'rotate('+(-m.degrees*(1-t))+' '+m.cx+' '+m.cy+')':undefined;return <g key={l.id} data-vector-layer={l.id} transform={transform} opacity={m?.kind==='reveal'?t:1}>
 {l.paths.map((p,i)=><path key={i} d={p.d} fill={colors[p.fill]} fillOpacity={p.fill==='muted'?.18:1} stroke={colors[p.stroke]} strokeOpacity={p.stroke==='muted'?.45:1} strokeWidth={p.width} strokeLinecap="round" strokeLinejoin="round" opacity={p.opacity??1} {...(m?.kind==='draw'?{pathLength:1,strokeDasharray:1,strokeDashoffset:1-t}: {})}/>)}
 </g>;})}
 {visual.labels.map((l,i)=><text key={i} x={l.x} y={l.y} fontSize={25} fontWeight={700} fill={theme.foreground} textAnchor="middle">{l.text}</text>)}
 </svg>;
}
