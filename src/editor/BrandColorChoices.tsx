import {useState} from 'react';
import {Button} from '../design-system/components';
import type {Project} from '../core/project';
import {videoPalettes,paletteReadable,samePalette} from './video-palettes';
type Theme=Project['theme'];
export function brandColorName(theme:Theme){return videoPalettes.find(p=>samePalette(p.theme,theme))?.name??'직접 설정한 컬러';}
export function BrandColorChoices({value,disabled,onChange,allowAuto=false}:{value:Theme|null;disabled:boolean;onChange:(theme:Theme|null)=>void;allowAuto?:boolean}){
 const [category,setCategory]=useState('전체');
 return <div className="brand-color-choices" aria-label="브랜드 컬러 선택">
 {allowAuto&&<div className="flex flex-wrap items-center gap-3"><Button variant={value===null?'primary':'secondary'} aria-pressed={value===null} disabled={disabled} onClick={()=>onChange(null)}>AI 컬러 추천</Button><p className="text-sm text-slate-600">잘 모르겠다면 주제에 맞는 컬러를 AI가 정해요.</p></div>}
 <div role="group" aria-label="컬러 분위기" className="flex flex-wrap gap-2">{['전체','프리미엄','테크','미니멀','자연','감성','볼드'].map(c=><Button key={c} variant={category===c?'primary':'ghost'} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</Button>)}</div>
 <div className="brand-color-grid">{videoPalettes.filter(p=>(category==='전체'||p.category===category)&&paletteReadable(p.theme)).map(p=>{const active=!!value&&samePalette(p.theme,value);return <button type="button" key={p.id} disabled={disabled} aria-label={p.name} aria-pressed={active} onClick={()=>onChange(p.theme)} className={'brand-color-card'+(active?' is-selected':'')}><span className="brand-color-sample" style={{background:p.theme.background,color:p.theme.foreground}} aria-hidden="true"><span className="text-[11px] font-semibold" style={{color:p.theme.accent}}>BRAND COLOR</span><span className="text-lg font-bold leading-tight">작은 선택,<br/>큰 변화</span><span className="brand-color-swatch" style={{background:p.theme.accent}}/></span><span className="brand-color-swatches" aria-hidden="true">{Object.values(p.theme).map(c=><span key={c} style={{background:c}}/>)}</span><span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{p.name}</span>{active&&<span className="text-xs font-semibold text-cobalt">선택됨</span>}</span><span className="text-xs text-slate-500">{p.category}</span></button>;})}</div>
 </div>;
}
