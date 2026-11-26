import type {Project} from './project';
import {briefKey} from './creative-brief';
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function assertRequestInputs(original:Project,current:Project){
 const a=original,b=current;
 if(a.id!==b.id||a.script!==b.script||a.audio!==b.audio||a.durationMs!==b.durationMs||a.timingSource!==b.timingSource||!equal(a.captions,b.captions)||!equal(a.analysis,b.analysis))throw new Error('제작 요청 이후 원본 대본·음성·타이밍이 변경되었습니다. 새 요청이 필요합니다.');
 if((a.styleId??'auto')!==(b.styleId??'auto')||briefKey(a.creativeBrief)!==briefKey(b.creativeBrief)||(a.referenceBrief??'')!==(b.referenceBrief??''))throw new Error('제작 요청 이후 스타일 또는 연출 지침이 변경되었습니다. 새 요청이 필요합니다.');
 for(const asset of a.assets??[])if(!equal(asset,b.assets?.find(x=>x.id===asset.id)))throw new Error('제작 요청의 기존 소재가 변경되었습니다. 새 요청이 필요합니다.');
 const ids=new Set((a.assets??[]).map(x=>x.id));
 if((b.assets??[]).some(x=>!ids.has(x.id)&&x.role!=='production'))throw new Error('새 참고 자료가 추가되었습니다. 새 요청이 필요합니다.');
}
