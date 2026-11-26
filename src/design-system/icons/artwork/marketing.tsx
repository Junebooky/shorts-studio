export function TrendArtwork(){
 return <>
  <rect x="10" y="12" width="76" height="72" rx="18" fill="var(--ss-icon-light)"/>
  <path d="M22 68H74" stroke="var(--ss-icon-deep)" strokeWidth="3" opacity=".45" strokeLinecap="round"/>
  <g fill="var(--ss-icon-base)">
   <rect className="ss-icon-trend-bar" x="25" y="49" width="10" height="19" rx="3"/>
   <rect className="ss-icon-trend-bar" style={{animationDelay:'.12s'}} x="42" y="40" width="10" height="28" rx="3"/>
   <rect className="ss-icon-trend-bar" style={{animationDelay:'.24s'}} x="59" y="29" width="10" height="39" rx="3"/>
  </g>
  <g className="ss-icon-trend-arrow" stroke="var(--ss-icon-deep)" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
   <path d="M24 42 39 30 49 34 69 17"/><path d="M58 17H69V28"/>
  </g>
 </>;
}
export function CampaignArtwork(){
 return <>
  <circle cx="47" cy="50" r="36" fill="var(--ss-icon-light)"/>
  <circle cx="47" cy="50" r="27" fill="var(--ss-icon-base)"/>
  <circle cx="47" cy="50" r="18" fill="var(--ss-icon-ink)" opacity=".95"/>
  <circle cx="47" cy="50" r="9" fill="var(--ss-icon-base)"/>
  <g className="ss-icon-campaign-arrow" stroke="var(--ss-icon-deep)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
   <path d="M47 50 76 21" fill="none"/>
   <path d="M66 22 80 12 79 26 69 29Z" fill="var(--ss-icon-deep)" strokeWidth="2"/>
  </g>
  <circle className="ss-icon-campaign-ring" cx="47" cy="50" r="35" fill="none" stroke="var(--ss-icon-deep)" strokeWidth="2"/>
 </>;
}
