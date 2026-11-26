import {useRef,useState,type ChangeEvent,type CSSProperties} from 'react';
import {Check,ImagePlus,Palette,Type,MessageSquareText,Clapperboard,Images} from 'lucide-react';
import {Button,Card,inputClass} from '../design-system/components';
import {brandFonts,brandTones,brandStyles,contrastRatio,readableInk,validateLogoFile,type BrandKit} from './brand-kit';
import type {useBrandKit} from './useBrandKit';
const fontLabels={sans:'산세리프 · 깔끔한',serif:'세리프 · 에디토리얼',mono:'모노스페이스 · 기술적인'};
const fontFamilies={sans:'"Noto Sans KR", sans-serif',serif:'"Noto Serif KR", Georgia, serif',mono:'ui-monospace, monospace'};
const toneLabels={friendly:'친근한',professional:'전문적인',energetic:'활기찬',calm:'차분한'};
const toneSamples={friendly:'복잡한 이야기도 쉽게 알려드릴게요!',professional:'핵심을 정확하고 명확하게 전달합니다.',energetic:'지금, 새로운 가능성을 발견해 보세요!',calm:'작은 변화부터 차근차근 시작해 보세요.'};
const styleLabels={minimal:'미니멀',editorial:'에디토리얼',bold:'볼드'};
const colorFields=[['primary','대표 색상'],['accent','강조 색상'],['background','배경 색상'],['foreground','글자 색상']] as const;
const formats=[{id:'video',label:'영상',icon:Clapperboard},{id:'card',label:'카드뉴스',icon:Images},{id:'thread',label:'스레드',icon:MessageSquareText}] as const;
type Format=typeof formats[number]['id'];
function BrandPreview({kit,format}:{kit:BrandKit;format:Format}){
 const style:CSSProperties={backgroundColor:kit.background,color:kit.foreground,fontFamily:fontFamilies[kit.font]};
 return <div className={'brand-preview brand-preview-'+format+' brand-style-'+kit.style} style={style} data-testid="brand-preview">
  <div className="brand-preview-top">{kit.logo?<img src={kit.logo} alt="브랜드 로고 미리보기"/>:<span className="brand-preview-symbol" style={{background:kit.primary,color:readableInk(kit.primary)}}>{Array.from(kit.name.trim()||'B')[0]}</span>}<span className="break-words min-w-0">{kit.name.trim()||'내 브랜드'}</span></div>
  {format!=='thread'&&<div className="brand-preview-art" aria-hidden="true"><span style={{background:kit.primary}}/><span style={{background:kit.accent}}/><span style={{background:kit.primary,opacity:.35}}/></div>}
  <div className="brand-preview-copy"><p className="brand-preview-kicker">BRAND STORY</p><p className="brand-preview-title">새로운 이야기를 시작하세요</p><p className="brand-preview-text">{toneSamples[kit.tone]}</p></div>
  <span className="brand-preview-pill" style={{background:kit.primary,color:readableInk(kit.primary)}}>{format==='video'?'00:15':format==='card'?'01 / 05':'1 / 4'}</span>
 </div>;
}
export function BrandKitPanel({brand}:{brand:ReturnType<typeof useBrandKit>}){
 const {draft,dirty,change,save,reload,notice,error,readOnly}=brand;
 const [format,setFormat]=useState<Format>('card');
 const [logoError,setLogoError]=useState(''),[loading,setLoading]=useState(false);
 const fileInput=useRef<HTMLInputElement>(null);
 const upload=async(e:ChangeEvent<HTMLInputElement>)=>{
  const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(!file)return;
  setLoading(true);setLogoError('');
  try{validateLogoFile(file);const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('로고를 읽지 못했어요.'));reader.readAsDataURL(file);});const image=new Image();image.src=data;await image.decode();if(image.naturalWidth>4096||image.naturalHeight>4096)throw new Error('로고는 가로·세로 4096px 이하로 준비해 주세요.');change({logo:data});}
  catch(e){setLogoError(e instanceof Error?e.message:'로고를 불러오지 못했어요.');}finally{setLoading(false);}
 };
 const ratio=contrastRatio(draft.background,draft.foreground);
 return <main className="marketing-module brand-kit-page">
  <div className="marketing-home-heading"><div><p className="text-sm font-medium text-cobalt">콘텐츠 라이브러리</p><h1 className="text-3xl font-bold tracking-tight mt-2">브랜드 키트</h1><p className="text-sm text-slate-600 mt-3 leading-relaxed">브랜드의 시각적 스타일과 말투를 한 곳에서 정해 보세요.</p></div><div className="flex flex-wrap items-center gap-2"><span role="status" className="text-xs text-slate-500">{dirty?'저장하지 않은 변경 사항':brand.saved.name?'저장된 설정':'기본 설정'}</span><Button disabled={readOnly||loading||!dirty} onClick={save}><Check size={17}/>브랜드 저장</Button></div></div>
  <p className="text-sm text-slate-500 mb-5">이 브라우저에 저장되는 공통 브랜드 설정이에요. 현재 제작 엔진에 자동 적용되지는 않아요.</p>
  {error&&<div role="alert" className="rounded-xl bg-rose-50 p-3 mb-4 space-y-2 text-sm text-rose-800"><p>{error}</p><Button variant="secondary" onClick={reload}>새로 불러오기</Button></div>}
  {notice&&<p role="status" className="text-sm text-emerald-700 mb-4">{notice}</p>}
  <div className="brand-kit-layout">
   <div className="space-y-4 min-w-0">
    <Card className="space-y-4"><h2 className="text-lg font-semibold">브랜드 기본 정보</h2>
     <label className="block text-sm font-medium">브랜드 이름<input className={inputClass+' mt-1.5'} maxLength={100} value={draft.name} onChange={e=>change({name:e.target.value})} placeholder="내 브랜드 이름"/></label>
     <div className="flex gap-3 items-center flex-wrap"><div className="brand-logo-tile">{draft.logo?<img src={draft.logo} alt="등록한 브랜드 로고"/>:<ImagePlus size={28} aria-hidden="true" className="text-slate-400"/>}</div><div className="flex-1 min-w-0 space-y-2"><p className="text-sm font-medium">브랜드 로고</p><p className="text-xs text-slate-500">PNG, JPG, WebP · 최대 256KB</p><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="브랜드 로고 파일" className="sr-only" disabled={loading||readOnly} onChange={upload}/><div className="flex gap-2 flex-wrap"><Button variant="secondary" disabled={loading||readOnly} onClick={()=>fileInput.current?.click()}>{loading?'불러오는 중':'로고 업로드'}</Button>{draft.logo&&<Button variant="ghost" disabled={loading||readOnly} onClick={()=>change({logo:null})}>로고 제거</Button>}</div></div></div>
     {logoError&&<p role="alert" className="text-sm text-rose-700">{logoError}</p>}
    </Card>
    <Card className="space-y-4"><h2 className="text-lg font-semibold flex gap-2 items-center"><Palette size={20} className="text-cobalt"/>브랜드 컬러</h2><div className="brand-color-grid">{colorFields.map(([key,label])=><label key={key} className="brand-color-field"><input type="color" aria-label={label} value={draft[key]} onChange={e=>change({[key]:e.target.value})}/><span className="text-sm font-medium">{label}</span><span className="text-xs text-slate-500 font-mono">{draft[key].toUpperCase()}</span></label>)}</div>
     <p role="status" className={'text-sm rounded-xl p-3 '+(ratio>=4.5?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-900')}>글자와 배경 대비 {ratio.toFixed(2)}:1 · {ratio>=4.5?'일반 텍스트 기준 충족':'일반 텍스트 권장 대비 4.5:1 미달'}</p>
    </Card>
    <Card className="space-y-4"><h2 className="text-lg font-semibold flex gap-2 items-center"><Type size={20} className="text-cobalt"/>타이포그래피와 스타일</h2>
     <label className="block text-sm font-medium">브랜드 폰트 계열<select className={inputClass+' mt-1.5'} value={draft.font} onChange={e=>change({font:e.target.value as BrandKit['font']})}>{brandFonts.map(f=><option key={f} value={f}>{fontLabels[f]}</option>)}</select></label>
     <fieldset><legend className="text-sm font-medium mb-2">디자인 스타일</legend><div className="brand-choice-grid">{brandStyles.map(s=><button key={s} type="button" aria-pressed={draft.style===s} className={'brand-choice'+(draft.style===s?' is-active':'')} onClick={()=>change({style:s})}>{styleLabels[s]}</button>)}</div></fieldset>
     <p className="text-xs text-slate-500">폰트 계열은 미리보기용이에요. 설치된 글꼴에 따라 실제 글꼴은 달라질 수 있어요.</p>
    </Card>
    <Card className="space-y-4"><h2 className="text-lg font-semibold flex gap-2 items-center"><MessageSquareText size={20} className="text-cobalt"/>브랜드 말투</h2><fieldset><legend className="text-sm font-medium mb-2">콘텐츠의 말투</legend><div className="brand-choice-grid">{brandTones.map(t=><button key={t} type="button" aria-pressed={draft.tone===t} className={'brand-choice'+(draft.tone===t?' is-active':'')} onClick={()=>change({tone:t})}>{toneLabels[t]}</button>)}</div></fieldset><label className="block text-sm font-medium">브랜드 가이드라인<textarea className={inputClass+' mt-1.5 resize-y'} rows={4} maxLength={1000} value={draft.guidelines} onChange={e=>change({guidelines:e.target.value})} placeholder="예: 전문 용어는 쉽게 풀어 쓰고 과장된 표현은 피해주세요."/></label></Card>
   </div>
   <Card className="brand-preview-panel space-y-4 min-w-0"><h2 className="text-lg font-semibold">실시간 미리보기</h2><div className="brand-format-tabs" role="group" aria-label="브랜드 미리보기 형식">{formats.map(f=><button key={f.id} type="button" aria-pressed={format===f.id} onClick={()=>setFormat(f.id)}><f.icon size={16} aria-hidden="true"/>{f.label}</button>)}</div><BrandPreview kit={draft} format={format}/><p className="text-xs text-slate-500 leading-relaxed">설정한 컬러, 폰트 계열, 스타일과 말투를 반영한 예시예요. 실제 제작 결과나 AI 생성 영상은 아니에요.</p></Card>
  </div>
 </main>;
}
