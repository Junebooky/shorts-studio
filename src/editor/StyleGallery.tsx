import {Card} from '../design-system/components';
import type {Project} from '../core/project';
import {BrandColorChoices,brandColorName} from './BrandColorChoices';
export function StyleGallery({value,disabled,onChange}:{value:Project['theme']|null;disabled:boolean;onChange:(theme:Project['theme']|null)=>void}){
 return <Card className="lg:col-span-2 xl:col-span-3 space-y-4"><div><h2 className="font-semibold text-lg">브랜드 컬러</h2><p className="text-sm text-slate-600 mt-2">배경·글자·강조색만 선택해요. 그래픽의 모양과 움직임은 대본에 맞춰 설계돼요.</p>{value&&<p className="text-sm text-cobalt font-medium mt-2">선택한 컬러 · {brandColorName(value)}</p>}</div><BrandColorChoices value={value} disabled={disabled} onChange={onChange} allowAuto/></Card>;
}
