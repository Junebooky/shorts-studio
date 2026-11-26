import {Button,Card} from '../design-system/components';
import type {Project} from '../core/project';
import {BrandColorChoices} from './BrandColorChoices';
type Theme=Project['theme'];
export function PalettePicker({current,preview,disabled,canApply,onPreview,onApply}:{current:Theme;preview:Theme|null;disabled:boolean;canApply:boolean;onPreview:(theme:Theme|null)=>void;onApply:(theme:Theme)=>void}){
 return <Card className="space-y-5"><h2 className="text-lg font-semibold">브랜드 컬러 변경</h2><p className="text-sm text-slate-600">추천 조합을 선택하면 실제 영상 미리보기의 색상만 바뀌어요.</p>
 <BrandColorChoices value={preview??current} disabled={disabled} onChange={theme=>{if(theme)onPreview(theme);}}/>
 {preview&&<div className="space-y-3"><p className="text-xs text-slate-600">미리보기 중 · 아직 저장하지 않았어요.</p><div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={disabled} onClick={()=>onPreview(null)}>원래 컬러 보기</Button><Button disabled={disabled||!canApply} onClick={()=>onApply(preview)}>컬러 적용</Button></div>{!canApply&&<p className="text-xs text-slate-500">데모를 복제하면 컬러를 저장할 수 있어요.</p>}</div>}
 <p className="text-xs text-slate-500">색상 변경은 AI나 성우를 다시 호출하지 않아요. 저장한 뒤 새 MP4를 렌더링하면 기존 파일은 유지돼요. 외부 소재의 원래 색은 유지될 수 있어요.</p></Card>;
}
