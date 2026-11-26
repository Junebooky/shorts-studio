import React from 'react';
import {interpolate,useCurrentFrame,useVideoConfig,spring} from 'remotion';
import type {Visual} from '../core/visual';
import type {Project} from '../core/project';
const clamp={extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
export function EditorialGraphic({visual,theme}:{visual:Visual;theme:Project['theme']}){
 const f=useCurrentFrame(),{fps}=useVideoConfig(),p=spring({frame:f,fps,config:{damping:22,stiffness:95}});
 const appear=(i:number)=>interpolate(f,[i*8,i*8+16],[0,1],clamp);
 const ink=theme.foreground,accent=theme.accent;
 const caption=(text:string,x:number,y:number,size=32,color=ink)=><text x={x} y={y} fill={color} fontSize={size} fontWeight={700} textAnchor="middle">{text}</text>;
 return <svg width="100%" viewBox="0 0 800 480" aria-hidden="true" style={{display:'block',overflow:'visible'}}>
 {visual.type==='path'&&<><path d="M110 355 C245 355 220 245 400 245 S555 120 690 120" fill="none" stroke={accent} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-Math.min(1,p)}/>{visual.labels.map((l,i)=>{const x=[110,400,690][i],y=[355,245,120][i];return <g key={i} opacity={appear(i)}><circle cx={x} cy={y} r={27} fill={theme.background} stroke={accent} strokeWidth={7}/><circle cx={x} cy={y} r={9} fill={accent}/>{caption(l,x,y+(i===0?65:-48),27)}</g>})}</>}
 {visual.type==='contrast'&&<>{[visual.left,visual.right].map((l,i)=><g key={i} opacity={appear(i)}><rect x={48+i*370} y={75} width={334} height={330} rx={28} fill={accent} opacity={i?.16:.06}/>{i===0?<g stroke={ink} strokeWidth={4} opacity=".75">{[0,1,2,3,4].map(k=><rect key={k} x={115+k*15} y={119+k*18} width={173-k*18} height={145-k*10} rx={7} fill={theme.background}/>)}</g>:<><circle cx={585} cy={225} r={82*p} fill={accent}/><path d="M548 225 L577 254 L629 198" stroke={theme.background} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>}{caption(l,215+i*370,360,35)}</g>)}<path d="M390 240 H410 M400 230 L410 240 L400 250" stroke={accent} strokeWidth={4} fill="none"/></>}
 {visual.type==='cycle'&&<><circle cx={400} cy={238} r={135} fill="none" stroke={accent} strokeWidth={5} strokeDasharray="8 12" opacity=".5"/><path d="M400 103 A135 135 0 1 1 272 280" fill="none" stroke={accent} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-Math.min(1,p)}/>{visual.labels.map((l,i)=>{const a=-Math.PI/2+i*2*Math.PI/3,x=400+135*Math.cos(a),y=238+135*Math.sin(a);return <g key={i} opacity={appear(i)}><circle cx={x} cy={y} r={48} fill={theme.background} stroke={accent} strokeWidth={5}/>{caption(String(i+1),x,y+12,34,accent)}{caption(l,x,y+(i===0?-65:86),30)}</g>})}</>}
 {visual.type==='focus'&&<><rect x={60} y={100} width={680} height={278} rx={32} fill={accent} opacity=".1"/><path d="M100 145 H170 M100 145 V205 M700 333 H630 M700 333 V273" stroke={accent} strokeWidth={8} fill="none" strokeLinecap="round"/><g transform={'translate(400 250) scale('+(.85+.15*p)+')'}>{caption(visual.word,0,24,visual.word.length>7?51:76,accent)}</g><rect x={210} y={310} width={380*Math.min(1,p)} height={7} rx={3} fill={accent}/></>}
 {visual.type==='typography'&&<><g opacity={appear(0)} transform={'translate(0 '+((1-p)*20)+')'}>{caption(visual.lines[0],400,180,visual.lines[0].length>7?56:76,ink)}</g><rect x={130} y={228} width={540*Math.min(1,p)} height={6} rx={3} fill={accent}/><g opacity={appear(1)}>{caption(visual.lines[1],400,333,visual.lines[1].length>7?60:84,accent)}</g></>}
 </svg>;
}
