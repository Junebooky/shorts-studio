import {Button,Card} from '../design-system/components';
import type {SharedContent} from './shared-content';
export function CommonSourcePanel({record,onApplyBrand,onConvertCard}:{record:SharedContent;onApplyBrand?:()=>void;onConvertCard?:()=>void}){
 const source=record.source;
 return <div data-testid="common-source"><Card className="space-y-4"><div><h2 className="text-lg font-semibold">공통 콘텐츠 원본</h2><p className="text-sm text-slate-600 mt-2">원고와 브랜드를 한 번 정하고 다른 콘텐츠에서도 활용해요.</p></div>
 {!source?<p className="text-sm text-slate-600">아직 공통 원고가 없어요. 숏츠 초안이 준비되면 원고·자막·장면·컬러가 여기에 저장돼요. 새 계획에서 직접 원고를 입력할 수도 있어요.</p>:<>
 <div className="space-y-2"><p className="text-xs font-semibold text-cobalt">{source.kind==='video'?'영상에서 가져온 원본 · 리비전 '+source.revision:'직접 작성한 원고'}</p><p className="font-semibold break-words">{source.title}</p>{source.kind==='video'&&<p className="text-sm text-slate-600">장면 {source.scenes.length}개 · 자막 {source.captions.length}개 · 원본 영상 리비전 고정</p>}</div>
 <details className="rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer font-semibold text-sm">공통 원고 보기</summary><p className="whitespace-pre-wrap break-words text-sm leading-relaxed mt-3" data-testid="common-narration">{source.script}</p></details>
 {source.kind==='video'&&<div className="flex flex-wrap items-center gap-3"><div className="flex gap-1" aria-label="원본 영상 컬러">{Object.entries(source.theme).map(([key,c])=><span key={key} className="w-8 h-8 rounded-md ring-1 ring-slate-200" style={{background:c}} title={c}/>)}</div>{onConvertCard&&<Button onClick={onConvertCard}>영상으로 카드뉴스 만들기</Button>}{onApplyBrand&&<Button variant="secondary" onClick={onApplyBrand}>원본 브랜드 컬러 적용</Button>}</div>}
 <p className="text-xs text-slate-500">원본은 이 브라우저에 저장된 스냅샷이에요. 기존 영상의 수정 내용은 자동으로 덮어쓰지 않으며, 카드뉴스와 스레드가 완성됐다는 뜻은 아니에요.</p>
 </>}
 </Card></div>;
}
