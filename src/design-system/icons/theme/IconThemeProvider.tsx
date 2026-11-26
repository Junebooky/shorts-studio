import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import type {IconName} from '../types';
import {normalizeHex} from './color-utils';
import {getPalette,getColors} from './palettes';
import {ICON_THEME_KEY,defaultTheme,parseTheme,type IconTheme} from './storage';
type ThemeContext={theme:IconTheme;setPalette:(id:string)=>void;setColor:(name:IconName,value:string)=>void;setMotionEnabled:(enabled:boolean)=>void;reset:()=>void;storageError:boolean};
const fallback:ThemeContext={theme:defaultTheme(),setPalette:()=>{},setColor:()=>{},setMotionEnabled:()=>{},reset:()=>{},storageError:false};
const Context=createContext<ThemeContext>(fallback);
function initial():IconTheme {try{return parseTheme(window.localStorage.getItem(ICON_THEME_KEY));}catch{return defaultTheme();}}
export function IconThemeProvider({children}:{children:ReactNode}){
 const [theme,setTheme]=useState(initial);
 const [storageError,setStorageError]=useState(false);
 useEffect(()=>{try{window.localStorage.setItem(ICON_THEME_KEY,JSON.stringify(theme));setStorageError(false);}catch{setStorageError(true);}},[theme]);
 const setPalette=(id:string)=>{const p=getPalette(id);setTheme(t=>({...t,paletteId:p.id,colors:getColors(p.id)}));};
 const setColor=(name:IconName,value:string)=>{const c=normalizeHex(value);if(c)setTheme(t=>({...t,colors:{...t.colors,[name]:c}}));};
 const setMotionEnabled=(enabled:boolean)=>setTheme(t=>({...t,motionEnabled:enabled}));
 return <Context.Provider value={{theme,setPalette,setColor,setMotionEnabled,reset:()=>setTheme(defaultTheme()),storageError}}>{children}</Context.Provider>;
}
export function useIconTheme(){return useContext(Context);}
