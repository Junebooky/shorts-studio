import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {iconRegistry} from './registry';
import type {IconName,IconMotion} from './types';
import {deriveColors,normalizeHex} from './theme/color-utils';
import {useIconTheme} from './theme/IconThemeProvider';
export type AnimatedIconProps={name:IconName;size?:number;motion?:IconMotion;color?:string;label?:string;className?:string;active?:boolean};
export function AnimatedIcon({name,size=48,motion='none',color,label,className='',active=false}:AnimatedIconProps){
 const {theme}=useIconTheme();
 const {base,light,mid,deep,ink}=deriveColors(normalizeHex(color)??theme.colors[name]);
 const Artwork=iconRegistry[name];
 const ref=useRef<SVGSVGElement>(null);
 const [visible,setVisible]=useState(true);
 useEffect(()=>{
  const el=ref.current;
  if(!el||motion!=='loop'||typeof IntersectionObserver==='undefined'){setVisible(true);return;}
  const observer=new IntersectionObserver(entries=>setVisible(entries[0]?.isIntersecting??true));
  observer.observe(el);return ()=>observer.disconnect();
 },[motion]);
 const style={'--ss-icon-base':base,'--ss-icon-light':light,'--ss-icon-mid':mid,'--ss-icon-deep':deep,'--ss-icon-ink':ink} as CSSProperties;
 const actualMotion=theme.motionEnabled?motion:'none';
 return <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width={size} height={size} className={'ss-animated-icon '+className} style={style} data-icon={name} data-motion={actualMotion} data-active={active?'true':'false'} data-visible={visible?'true':'false'} role={label?'img':undefined} aria-label={label||undefined} aria-hidden={label?undefined:true} focusable="false"><Artwork/></svg>;
}
