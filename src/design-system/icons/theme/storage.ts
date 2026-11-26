import {iconNames,type IconColors} from '../types';
import {normalizeHex} from './color-utils';
import {defaultPalette,getColors,palettes} from './palettes';
export const ICON_THEME_KEY='shorts-studio.icon-theme.v1';
export type IconTheme={version:1;paletteId:string;colors:IconColors;motionEnabled:boolean};
export function defaultTheme():IconTheme {return {version:1,paletteId:defaultPalette.id,colors:getColors(defaultPalette.id),motionEnabled:true};}
export function parseTheme(raw:string|null):IconTheme {
 if(!raw)return defaultTheme();
 try{
  const v=JSON.parse(raw);
  if(!v||v.version!==1||!palettes.some(p=>p.id===v.paletteId)||typeof v.motionEnabled!=='boolean')return defaultTheme();
  const colors=getColors(v.paletteId);
  for(const name of iconNames){const c=normalizeHex(v.colors?.[name]);if(c)colors[name]=c;}
  return {version:1,paletteId:v.paletteId,colors,motionEnabled:v.motionEnabled};
 }catch{return defaultTheme();}
}
