import {useId,type CSSProperties} from 'react';
import type {CompletionColors} from '../theme';
import {Stage,Celebration} from './shared';
export function CardNewsComplete({colors:c}:{colors:CompletionColors}){
 const id='ss-mg-card-'+useId().replace(/[^a-zA-Z0-9_-]/g,'-');
 return <Stage color={c.base}><defs><linearGradient id={id} x2="1" y2="1"><stop stopColor={c.surface}/><stop offset="1" stopColor={c.deep}/></linearGradient></defs>
 <g transform="rotate(-13 102 114)"><g className="ss-mg-fan" style={{'--delay':'300ms'} as CSSProperties}><rect x="58" y="42" width="93" height="143" rx="16" fill={c.mid}/><path d="M71 65H137M71 79H120" stroke="white" strokeWidth="5" strokeLinecap="round"/></g></g>
 <g transform="rotate(14 218 112)"><g className="ss-mg-fan" style={{'--delay':'550ms'} as CSSProperties}><rect x="173" y="38" width="93" height="143" rx="16" fill={c.light}/><path d="M187 60H250M187 74H237" stroke={c.surface} strokeWidth="5" strokeLinecap="round"/></g></g>
 <g className="ss-mg-enter" style={{'--delay':'750ms'} as CSSProperties}><rect x="108" y="25" width="112" height="171" rx="19" fill={c.deep}/><rect x="102" y="19" width="112" height="171" rx="19" fill={'url(#'+id+')'}/>
 <rect x="114" y="33" width="88" height="73" rx="11" fill="white" opacity=".18"/><circle cx="135" cy="52" r="9" fill="white"/><path d="M116 94 139 71 156 84 178 61 200 91V104H116Z" fill="white"/>
 <path className="ss-mg-text" style={{'--delay':'1300ms'} as CSSProperties} d="M119 126H197M119 142H186M119 158H166" stroke="white" strokeWidth="6" strokeLinecap="round"/>
 </g><Celebration x={222} y={174}/>
 </Stage>;
}
