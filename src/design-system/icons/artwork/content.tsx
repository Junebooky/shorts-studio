export function ShortsArtwork(){
 return <>
  <rect x="23" y="7" width="50" height="82" rx="15" fill="var(--ss-icon-base)"/>
  <rect x="29" y="13" width="38" height="58" rx="9" fill="var(--ss-icon-ink)" opacity=".13"/>
  <path className="ss-icon-pulse" d="M40 34 61 46 40 58Z" fill="var(--ss-icon-ink)" stroke="var(--ss-icon-ink)" strokeWidth="2.5" strokeLinejoin="round"/>
  <path d="M31 77H65" stroke="var(--ss-icon-ink)" opacity=".3" strokeWidth="3" strokeLinecap="round"/>
  <path className="ss-icon-progress" d="M31 77H65" stroke="var(--ss-icon-ink)" strokeWidth="3" strokeLinecap="round"/>
 </>;
}
export function CardNewsArtwork(){
 return <>
  <g className="ss-icon-card-back"><rect x="31" y="13" width="49" height="64" rx="11" fill="var(--ss-icon-light)"/><rect x="24" y="15" width="49" height="64" rx="11" fill="var(--ss-icon-mid)"/></g>
  <g className="ss-icon-card-front"><rect x="16" y="19" width="50" height="64" rx="11" fill="var(--ss-icon-base)"/><rect x="23" y="26" width="36" height="29" rx="6" fill="var(--ss-icon-ink)" opacity=".18"/><circle cx="32" cy="34" r="4" fill="var(--ss-icon-ink)"/><path d="m24 49 12-10 8 6 7-10 8 10v5H24Z" fill="var(--ss-icon-ink)"/><path d="M26 64H56M26 72H45" stroke="var(--ss-icon-ink)" strokeWidth="4" strokeLinecap="round"/></g>
 </>;
}
export function ThreadsArtwork(){
 return <>
  <path d="M20 20V76" stroke="var(--ss-icon-base)" opacity=".45" strokeWidth="3" strokeLinecap="round"/>
  {[20,48,76].map((y,i)=><g key={y} style={{animationDelay:i*.18+'s'}}>
   <circle className="ss-icon-node" style={{animationDelay:i*.18+'s'}} cx="20" cy={y} r="6" fill="var(--ss-icon-base)"/>
   <rect x="33" y={y-11} width="49" height="22" rx="7" fill="var(--ss-icon-base)"/>
   <path className="ss-icon-text" style={{animationDelay:i*.2+'s'}} d={'M41 '+(y-3)+'H73M41 '+(y+3)+'H'+(62+i*2)} stroke="var(--ss-icon-ink)" strokeWidth="2.8" strokeLinecap="round"/>
  </g>)}
 </>;
}
