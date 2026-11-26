import {useId} from 'react';
import type {CompletionColors} from '../theme';
import {Stage,Celebration} from './shared';
export function ShortsComplete({colors:c}:{colors:CompletionColors}){
 const id='ss-mg-video-'+useId().replace(/[^a-zA-Z0-9_-]/g,'-');
 return <Stage color={c.base}>
 <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor={c.gradient.start}/><stop offset=".48" stopColor={c.gradient.middle}/><stop offset="1" stopColor={c.gradient.end}/></linearGradient></defs>
 <g className="ss-mg-enter"><rect x="111" y="25" width="104" height="178" rx="24" fill={c.deep}/><rect x="105" y="18" width="104" height="178" rx="24" fill={'url(#'+id+')'}/>
 <rect x="115" y="28" width="84" height="129" rx="15" fill="white" opacity=".16"/>
 <g className="ss-mg-clap" transform="translate(0 0)"><rect x="127" y="48" width="61" height="16" rx="5" fill="white" opacity=".88"/><path d="m137 49 10 0-9 14h-10m31-14h10l-9 14h-10m31-14h7l-9 14h-10" fill={c.surface}/></g>
 <rect x="127" y="65" width="61" height="62" rx="11" fill={c.surface} opacity=".62"/><path className="ss-mg-play" d="M149 79Q146 77 146 81V109Q146 112 150 110L172 97Q175 95 172 93Z" fill="white"/>
 <path d="M126 171H188" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".35"/><path className="ss-mg-progress" d="M126 171H188" stroke="white" strokeWidth="5" strokeLinecap="round"/><path d="M145 184H169" stroke="white" strokeWidth="3" strokeLinecap="round" opacity=".7"/>
 </g><Celebration x={216} y={171}/>
 </Stage>;
}
