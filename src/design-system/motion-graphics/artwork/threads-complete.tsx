import type {CSSProperties} from 'react';
import type {CompletionColors} from '../theme';
import {Stage,Celebration} from './shared';
export function ThreadsComplete({colors:c}:{colors:CompletionColors}){
 return <Stage color={c.base}>
 <path className="ss-mg-connection" d="M76 45V166" stroke={c.surface} strokeWidth="5" strokeLinecap="round" pathLength="1" opacity=".5"/>
 {[45,104,163].map((y,i)=><g key={y} className="ss-mg-message" style={{'--delay':(200+i*480)+'ms'} as CSSProperties}>
 <circle cx="76" cy={y} r="11" fill={c.surface}/><circle cx="76" cy={y} r="4" fill="white"/>
 <rect x="99" y={y-24+5} width="151" height="48" rx="14" fill={c.deep} opacity=".45"/><rect x="95" y={y-24} width="151" height="48" rx="14" fill={c.surface}/>
 <path className="ss-mg-text" style={{'--delay':(450+i*480)+'ms'} as CSSProperties} d={'M110 '+(y-6)+'H228M110 '+(y+9)+'H'+(185+i*8)} stroke="white" strokeWidth="5" strokeLinecap="round"/>
 </g>)}<Celebration x={244} y={175}/></Stage>;
}
