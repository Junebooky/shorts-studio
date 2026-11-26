import {iconNames} from '../types';
import {iconLabels} from '../registry';
import {palettes} from '../theme/palettes';
import {useIconTheme} from '../theme/IconThemeProvider';
export function IconPalettePanel(){
 const {theme,setPalette,setColor,setMotionEnabled,reset,storageError}=useIconTheme();
 return <details className="ss-home-icon-settings" data-testid="home-icon-settings">
  <summary>아이콘 색상 설정</summary>
  <p className="text-xs text-slate-500 mt-2">아이콘의 색상만 바뀌어요. 제작하는 콘텐츠의 브랜드 컬러는 그대로예요.</p>
  <div className="ss-home-palette-grid" aria-label="아이콘 컬러 테마">{palettes.map(p=><button type="button" key={p.id} aria-pressed={theme.paletteId===p.id} className="ss-home-palette-choice" onClick={()=>setPalette(p.id)}><span className="ss-home-swatches" aria-hidden="true">{iconNames.map(name=><span key={name} style={{background:p.colors[name]}}/>)}</span>{p.label}</button>)}</div>
  <div className="ss-home-color-grid">{iconNames.map(name=><label key={name}>{iconLabels[name]}<input type="color" aria-label={iconLabels[name]+' 아이콘 색상'} value={theme.colors[name]} onChange={e=>setColor(name,e.target.value)}/><code>{theme.colors[name]}</code></label>)}</div>
  <div className="ss-home-palette-actions"><label><input type="checkbox" checked={theme.motionEnabled} onChange={e=>setMotionEnabled(e.target.checked)}/> 아이콘 애니메이션 사용</label><button type="button" onClick={reset}>아이콘 기본값으로 초기화</button></div>
  {storageError&&<p role="status" className="text-xs text-rose-700 mt-2">이 브라우저에 아이콘 설정을 저장할 수 없어요.</p>}
 </details>;
}
