import {useId} from 'react';
export function ShortsArtwork(){
 const id='ss-reels-'+useId().replace(/[^a-zA-Z0-9_-]/g,'-');
 const paint='url(#'+id+')';
 return <>
  <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--ss-icon-gradient-start)"/><stop offset=".48" stopColor="var(--ss-icon-gradient-middle)"/><stop offset="1" stopColor="var(--ss-icon-gradient-end)"/></linearGradient></defs>
  <rect x="15" y="32" width="66" height="48" rx="15" fill={paint}/>
  <g className="ss-icon-clap"><rect x="15" y="21" width="66" height="17" rx="6" fill={paint}/><path d="m25 22 10 0-11 15h-9zm23 0h10L47 37H37zm23 0h9L69 37H59z" fill="var(--ss-icon-ink)" opacity=".9"/></g>
  <g transform="translate(0 8)"><path d="M41 36 Q38 34 38 38 V58 Q38 62 42 60 L59 50 Q62 48 59 46 Z" fill="var(--ss-icon-ink)"/></g>
 </>;
}
export function CardNewsArtwork(){
 return <>
  <g className="ss-icon-card-back"><rect x="31" y="13" width="49" height="64" rx="11" fill="var(--ss-icon-light)"/><rect x="24" y="15" width="49" height="64" rx="11" fill="var(--ss-icon-mid)"/></g>
  <g className="ss-icon-card-front"><rect x="16" y="19" width="50" height="64" rx="11" fill="var(--ss-icon-surface)"/><rect x="23" y="26" width="36" height="29" rx="6" fill="var(--ss-icon-ink)" opacity=".18"/><circle cx="32" cy="34" r="4" fill="var(--ss-icon-ink)"/><path d="m24 49 12-10 8 6 7-10 8 10v5H24Z" fill="var(--ss-icon-ink)"/><path d="M26 64H56M26 72H45" stroke="var(--ss-icon-ink)" strokeWidth="4" strokeLinecap="round"/></g>
 </>;
}
export function ThreadsArtwork(){
 return <>
  <path d="M20 20V76" stroke="var(--ss-icon-base)" opacity=".45" strokeWidth="3" strokeLinecap="round"/>
  {[20,48,76].map((y,i)=><g key={y} style={{animationDelay:i*.18+'s'}}>
   <circle className="ss-icon-node" style={{animationDelay:i*.18+'s'}} cx="20" cy={y} r="6" fill="var(--ss-icon-surface)"/>
   <rect x="33" y={y-11} width="49" height="22" rx="7" fill="var(--ss-icon-surface)"/>
   <path className="ss-icon-text" style={{animationDelay:i*.2+'s'}} d={'M41 '+(y-3)+'H73M41 '+(y+3)+'H'+(62+i*2)} stroke="var(--ss-icon-ink)" strokeWidth="2.8" strokeLinecap="round"/>
  </g>)}
 </>;
}
