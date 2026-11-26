import type {ReactNode,CSSProperties} from 'react';
export function Stage({color,children}:{color:string;children:ReactNode}){
 return <><ellipse cx="160" cy="203" rx="97" ry="8" fill={color} opacity=".12"/><circle cx="160" cy="106" r="87" fill={color} opacity=".09"/>{children}</>;
}
export function Celebration({x=232,y=172,delay=1900}:{x?:number;y?:number;delay?:number}){
 return <>
 <g className="ss-mg-particles" style={{'--delay':delay+'ms'} as CSSProperties} fill="none" strokeLinecap="round">
 <path d="M52 52l-10-11M267 42l9-11M291 105h12M29 126H17" stroke="#E89A35" strokeWidth="5"/>
 <circle cx="67" cy="91" r="5" fill="#E89A35"/><circle cx="255" cy="78" r="5" fill="#D65391"/><circle cx="73" cy="170" r="4" fill="#168E86"/><rect x="249" y="156" width="8" height="16" rx="3" fill="#9874EA" transform="rotate(28 253 164)"/>
 <path d="M91 27l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#E89A35"/><path d="M244 22l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#8061D9"/>
 </g>
 <g transform={'translate('+x+' '+y+')'}><g className="ss-mg-check" style={{'--delay':delay+'ms'} as CSSProperties}>
 <circle r="32" fill="white"/><circle r="26" fill="#168A55"/><path className="ss-mg-check-line" d="m-12 0 8 8 16-18" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength="1"/>
 </g></g>
 </>;
}
