// User-approved 03-rocket.svg: original vector geometry and default colors.
export function ComingSoonArtwork(){
 return <>
  <circle cx="48" cy="48" r="37" fill="var(--ss-rocket-halo)"/>
  <g className="ss-icon-rocket-flame"><path d="M41 69Q48 62 55 69Q56 79 48 90Q40 79 41 69" fill="var(--ss-rocket-flame)"/><path d="M45 72Q48 69 51 72L48 82Z" fill="var(--ss-icon-ink)"/></g>
  <g className="ss-icon-rocket-body"><path d="M35 50 24 65V77L39 69M61 50 72 65V77L57 69" fill="var(--ss-rocket-fin)"/><path d="M48 10Q25 28 32 57L39 70H57L64 57Q71 28 48 10Z" fill="var(--ss-rocket-body)"/><circle cx="48" cy="37" r="10" fill="var(--ss-icon-ink)"/><circle cx="48" cy="37" r="5" fill="var(--ss-rocket-window)"/><path d="M40 60H56" stroke="var(--ss-icon-ink)" strokeWidth="4" strokeLinecap="round"/></g>
  <g className="ss-icon-rocket-stars" fill="var(--ss-rocket-body)"><path d="M17 23l2 5 5 2-5 2-2 5-2-5-5-2 5-2ZM80 35l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>
 </>;
}
