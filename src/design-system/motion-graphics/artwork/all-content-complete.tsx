import {useId,type CSSProperties} from 'react';
import type {MotionFormat} from '../types';
import type {CompletionColors} from '../theme';
import {Stage,Celebration} from './shared';
function Mini({format,colors:c}:{format:MotionFormat;colors:CompletionColors}){
 const id='ss-mg-mini-'+useId().replace(/[^a-zA-Z0-9_-]/g,'-');
 if(format==='shorts')return <><defs><linearGradient id={id} x2="1" y2="1"><stop stopColor={c.gradient.start}/><stop offset=".48" stopColor={c.gradient.middle}/><stop offset="1" stopColor={c.gradient.end}/></linearGradient></defs><rect x="-35" y="-65" width="70" height="130" rx="17" fill={'url(#'+id+')'}/><rect x="-27" y="-57" width="54" height="87" rx="10" fill="white" opacity=".18"/><path d="M-10 -31 17 -14 -10 3Z" fill="white" stroke="white" strokeWidth="3" strokeLinejoin="round"/><path d="M-21 46H21" stroke="white" strokeWidth="4" strokeLinecap="round"/></>;
 if(format==='card-news')return <><rect x="-25" y="-52" width="70" height="106" rx="13" fill={c.mid} transform="rotate(10)"/><rect x="-39" y="-49" width="75" height="109" rx="13" fill={c.surface}/><rect x="-30" y="-39" width="57" height="48" rx="8" fill="white" opacity=".2"/><circle cx="-16" cy="-26" r="6" fill="white"/><path d="m-29 2 15-15 11 9 13-15 16 17v10h-55Z" fill="white"/><path d="M-28 25H24M-28 38H13" stroke="white" strokeWidth="4" strokeLinecap="round"/></>;
 return <><path d="M-42 -38V42" stroke={c.surface} strokeWidth="3" opacity=".5"/>{[-38,2,42].map(y=><g key={y}><circle cx="-42" cy={y} r="6" fill={c.surface}/><rect x="-30" y={y-15} width="77" height="31" rx="8" fill={c.surface}/><path d={'M-22 '+(y-5)+'H37M-22 '+(y+6)+'H20'} stroke="white" strokeWidth="3" strokeLinecap="round"/></g>)}</>;
}
export function AllContentComplete({formats,colors}:{formats:readonly MotionFormat[];colors:Record<MotionFormat,CompletionColors>}){
 const positions=formats.length===1?[160]:formats.length===2?[104,216]:[65,160,255];
 return <Stage color={colors[formats[0]??'shorts'].base}>{formats.map((format,i)=><g key={format} transform={'translate('+positions[i]+' 103)'}><g className="ss-mg-assemble" style={{'--delay':(i*320)+'ms'} as CSSProperties}><Mini format={format} colors={colors[format]}/></g></g>)}{formats.length>0&&<Celebration x={160} y={177} delay={2300}/>}</Stage>;
}
