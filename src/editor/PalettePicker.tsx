import {useState} from 'react';
import {Check} from 'lucide-react';
import {Button,Card} from '../design-system/components';
import type {Project} from '../core/project';
import {brandColorName} from './BrandColorChoices';
import {videoPalettes,paletteReadable,samePalette} from './video-palettes';
type Theme=Project['theme'];
const categories=['전체','프리미엄','테크','미니멀','자연','감성','볼드'];
// Focused editor already has a live video preview. Only show the palette itself here.
export function PalettePicker({current,preview,disabled,canApply,onPreview,onApply}:{current:Theme;preview:Theme|null;disabled:boolean;canApply:boolean;onPreview:(theme:Theme|null)=>void;onApply:(theme:Theme)=>void}){
 const [category,setCategory]=useState('전체'),selected=preview??current;
 const choices=videoPalettes.filter(p=>(category==='전체'||p.category===category)&&paletteReadable(p.theme));
 return <Card className="space-y-4"><div data-testid="edit-palette-picker" className="space-y-4">
 <div className="flex items-center justify-between gap-3 flex-wrap"><h2 className="text-lg font-semibold">브랜드 컬러 변경</h2><span className="text-xs font-medium text-slate-500">{brandColorName(selected)}</span></div>
 <div role="group" aria-label="컬러 분위기" className="flex flex-wrap gap-1.5">{categories.map(c=><button type="button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)} className={'min-h-9 px-3 rounded-full text-xs font-semibold transition-colors '+(category===c?'bg-cobalt text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{c}</button>)}</div>
 <div role="group" aria-label="브랜드 컬러 선택" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,120px),1fr))] gap-2.5">
 {choices.map(p=>{const active=samePalette(p.theme,selected);return <button type="button" key={p.id} disabled={disabled} aria-label={p.name} aria-pressed={active} title={p.name} onClick={()=>onPreview(samePalette(p.theme,current)?null:p.theme)} className={'min-w-0 rounded-xl p-2 text-left transition-colors disabled:opacity-50 '+(active?'bg-blue-50 ring-2 ring-inset ring-cobalt':'hover:bg-slate-100 bg-slate-50')}><span data-testid="edit-palette-swatches" aria-hidden="true" className="flex h-7 overflow-hidden rounded-lg ring-1 ring-inset ring-black/10">{(['background','foreground','accent'] as const).map(k=><span key={k} className="flex-1" style={{background:p.theme[k]}}/>)}</span><span className="mt-1.5 flex min-w-0 items-center gap-1 text-[11px] font-semibold text-slate-700"><span className="min-w-0 truncate">{p.name}</span>{active&&<Check size={13} className="ml-auto shrink-0 text-cobalt" aria-hidden="true"/>}</span></button>;})}
 </div>
 {preview&&<div className="space-y-3"><p className="text-xs text-slate-600">미리보기 중 · 아직 적용하지 않았어요.</p><div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={disabled} onClick={()=>onPreview(null)}>원래 색상으로 돌아가기</Button><Button disabled={disabled||!canApply} onClick={()=>onApply(preview)}>색상 적용</Button></div>{!canApply&&<p className="text-xs text-slate-500">데모로 시작하면 컬러를 적용하고 저장할 수 있어요.</p>}</div>}
 <p className="text-xs leading-relaxed text-slate-500">색상은 영상 미리보기에 바로 반영돼요. 적용 후 저장하고 MP4를 다시 만들어 주세요. 기존 음성·영상 파일과 외부 소재는 유지돼요.</p>
 </div></Card>;
}
