import {Button,Card} from '../design-system/components';
import type {Project} from '../core/project';
import {BrandColorChoices} from './BrandColorChoices';
type Theme=Project['theme'];
export function PalettePicker({current,preview,disabled,canApply,onPreview,onApply}:{current:Theme;preview:Theme|null;disabled:boolean;canApply:boolean;onPreview:(theme:Theme|null)=>void;onApply:(theme:Theme)=>void}){
 return <Card className="space-y-5"><h2 className="text-lg font-semibold">브랜드 컬러 변경</h2><p className="text-sm text-slate-600">추천 색상을 고르고 실제 영상에 어울리는지 확인해 보세요.</p>
 <BrandColorChoices value={preview??current} disabled={disabled} onChange={theme=>{if(theme)onPreview(theme);}}/>
 {preview&&<div className="space-y-3"><p className="text-xs text-slate-600">미리보기 중 · 아직 적용하지 않았어요.</p><div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={disabled} onClick={()=>onPreview(null)}>원래 색상으로 돌아가기</Button><Button disabled={disabled||!canApply} onClick={()=>onApply(preview)}>색상 적용</Button></div>{!canApply&&<p className="text-xs text-slate-500">데모로 시작하면 컬러를 적용하고 저장할 수 있어요.</p>}</div>}
 <p className="text-xs text-slate-500">색상만 바꾸므로 AI와 음성을 새로 요청하지 않아요. 적용 후 저장하고 새 영상(MP4)을 만들어 주세요. 기존 영상 파일은 그대로 유지돼요. 외부 소재의 원래 색은 유지될 수 있어요.</p></Card>;
}
