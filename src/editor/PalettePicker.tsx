import {useState} from 'react';
import {Palette,Check} from 'lucide-react';
import {Button,Card} from '../design-system/components';
import type {Project} from '../core/project';
import {videoPalettes,paletteReadable,samePalette} from './video-palettes';
type Theme=Project['theme'];
export function PalettePicker({current,preview,disabled,canApply,onPreview,onApply}:{current:Theme;preview:Theme|null;disabled:boolean;canApply:boolean;onPreview:(theme:Theme|null)=>void;onApply:(theme:Theme)=>void}){
 const [category,setCategory]=useState('전체');
 const colors=preview??current;
 return <Card className="space-y-3"><h2 className="text-lg font-semibold flex items-center gap-2"><Palette size={19} className="text-cobalt"/>브랜드 컬러 변경</h2><p className="text-sm text-slate-600">추천 조합을 선택하면 실제 영상 미리보기의 색상만 바뀌어요.</p>
 <div role="group" aria-label="컬러 분위기" className="flex flex-wrap gap-1">{['전체','프리미엄','테크','미니멀','자연','감성','볼드'].map(c=><button type="button" key={c} aria-pressed={c===category} className={'px-3 py-2 text-xs rounded-full '+(c===category?'bg-cobalt text-white':'bg-slate-100 text-slate-600')} onClick={()=>setCategory(c)}>{c}</button>)}</div>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{videoPalettes.filter(p=>(category==='전체'||p.category===category)&&paletteReadable(p.theme)).map(p=><button type="button" disabled={disabled} aria-pressed={samePalette(p.theme,colors)} key={p.id} onClick={()=>onPreview(p.theme)} className={'rounded-xl p-2 text-left space-y-2 '+(samePalette(p.theme,colors)?'bg-blue-50 ring-2 ring-cobalt':'bg-slate-50')}><span className="flex rounded-lg h-10 overflow-hidden" aria-hidden="true">{Object.values(p.theme).map(c=><span key={c} className="flex-1" style={{background:c}}/>)}</span><span className="flex items-center justify-between text-xs font-semibold">{p.name}{samePalette(p.theme,colors)&&<Check size={14}/>}</span></button>)}</div>
 {preview&&<div className="space-y-2"><p className="text-xs text-slate-500">미리보기 중 · 아직 저장하지 않았어요.</p><div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={disabled} onClick={()=>onPreview(null)}>원래 컬러 보기</Button><Button disabled={disabled||!canApply} onClick={()=>onApply(preview)}>컬러 적용</Button></div>{!canApply&&<p className="text-xs text-slate-500">데모를 복제하면 컬러를 저장할 수 있어요.</p>}</div>}
 <p className="text-xs text-slate-500">색상 변경은 AI나 성우를 다시 호출하지 않아요. 저장한 뒤 새 MP4를 렌더링하면 기존 파일은 유지돼요. 외부 소재의 원래 색은 유지될 수 있어요.</p></Card>;
}
