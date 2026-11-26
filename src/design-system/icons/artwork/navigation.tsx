export function HomeArtwork(){
 return <>
  <path d="M13 43 42 15a9 9 0 0 1 12 0l29 28a5 5 0 0 1-3 9h-5v25a8 8 0 0 1-8 8H29a8 8 0 0 1-8-8V52h-5a5 5 0 0 1-3-9Z" fill="var(--ss-icon-surface)"/>
  <path d="M40 85V63a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v22" fill="var(--ss-icon-ink)"/>
  <rect className="ss-icon-home-window" x="39" y="34" width="18" height="15" rx="5" fill="var(--ss-icon-light)" stroke="var(--ss-icon-deep)" strokeWidth="2"/>
 </>;
}
export function CalendarArtwork(){
 return <>
  <rect x="12" y="21" width="72" height="64" rx="15" fill="var(--ss-icon-surface)"/>
  <rect x="20" y="37" width="56" height="40" rx="8" fill="var(--ss-icon-ink)"/>
  <path d="M30 13V28M66 13V28" stroke="var(--ss-icon-deep)" strokeWidth="8" strokeLinecap="round"/>
  <g fill="var(--ss-icon-surface)"><rect x="27" y="44" width="10" height="9" rx="2"/><rect x="43" y="44" width="10" height="9" rx="2"/><rect x="59" y="44" width="10" height="9" rx="2"/><rect x="27" y="61" width="10" height="9" rx="2"/><rect className="ss-icon-calendar-day" x="42" y="59" width="12" height="12" rx="3" fill="var(--ss-icon-deep)"/><rect x="59" y="61" width="10" height="9" rx="2"/></g>
 </>;
}
export function AnalyticsArtwork(){
 return <>
  <rect x="11" y="12" width="74" height="72" rx="17" fill="var(--ss-icon-surface)"/>
  <g fill="var(--ss-icon-ink)"><rect className="ss-icon-analytics-bar" x="23" y="51" width="12" height="20" rx="4"/><rect className="ss-icon-analytics-bar" style={{animationDelay:'.08s'}} x="42" y="36" width="12" height="35" rx="4"/><rect className="ss-icon-analytics-bar" style={{animationDelay:'.16s'}} x="61" y="24" width="12" height="47" rx="4"/></g>
  <path d="M22 75H74" stroke="var(--ss-icon-ink)" strokeWidth="2" strokeLinecap="round" opacity=".55"/>
 </>;
}
export function LibraryArtwork(){
 return <>
  <path d="M10 27a9 9 0 0 1 9-9h22l10 10h26a9 9 0 0 1 9 9v35a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10Z" fill="var(--ss-icon-deep)"/>
  <g className="ss-icon-library-paper"><rect x="31" y="15" width="41" height="49" rx="6" fill="var(--ss-icon-light)" stroke="var(--ss-icon-deep)" strokeWidth="2"/><path d="M39 26H63M39 34H60M39 42H57" stroke="var(--ss-icon-deep)" strokeWidth="3" strokeLinecap="round"/></g>
  <path d="M16 45h63a8 8 0 0 1 8 10l-6 20a10 10 0 0 1-10 7H21a10 10 0 0 1-10-9V53a8 8 0 0 1 5-8Z" fill="var(--ss-icon-surface)"/>
  <path d="M35 63H62" stroke="var(--ss-icon-ink)" strokeWidth="4" strokeLinecap="round"/>
 </>;
}
