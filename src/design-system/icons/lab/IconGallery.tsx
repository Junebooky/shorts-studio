import {useState} from 'react';
import {AnimatedIcon,iconNames,iconLabels,palettes,useIconTheme,type IconMotion} from '../index';
export function IconGallery(){
 const {theme,setPalette,setColor,setMotionEnabled,reset,storageError}=useIconTheme();
 const [size,setSize]=useState(80);
 const [motion,setMotion]=useState<IconMotion>('loop');
 return <main className="ss-lab">
  <header><p>SHORTS STUDIO · DESIGN SYSTEM</p><h1>Icon Design Lab</h1><p>아이콘의 색상과 움직임을 확인하고 나에게 맞게 바꿔 보세요.</p></header>
  <section aria-label="아이콘 미리보기" className="ss-lab-grid">{iconNames.map(name=><article key={name} className="ss-lab-card"><div className="ss-lab-stage"><AnimatedIcon name={name} size={size} motion={motion}/></div><strong>{iconLabels[name]}</strong><label>색상 <input aria-label={iconLabels[name]+' 색상'} type="color" value={theme.colors[name]} onChange={e=>setColor(name,e.target.value)}/><code>{theme.colors[name]}</code></label></article>)}</section>
  <section><h2>컬러 테마</h2><div className="ss-lab-palettes">{palettes.map(p=><button key={p.id} type="button" aria-pressed={p.id===theme.paletteId} onClick={()=>setPalette(p.id)}><span className="ss-lab-swatches">{iconNames.map(n=><span key={n} style={{background:p.colors[n]}}/>)}</span>{p.label}</button>)}</div></section>
  <section className="ss-lab-controls"><h2>크기와 모션</h2><label>크기 <select value={size} onChange={e=>setSize(Number(e.target.value))}>{[24,48,80,120].map(n=><option key={n} value={n}>{n}px</option>)}</select></label><label>모션 <select value={motion} onChange={e=>setMotion(e.target.value as IconMotion)}><option value="loop">반복</option><option value="hover">마우스 오버</option><option value="none">정지</option></select></label><label><input type="checkbox" checked={theme.motionEnabled} onChange={e=>setMotionEnabled(e.target.checked)}/> 애니메이션 사용</label><button type="button" onClick={()=>{reset();setSize(80);setMotion('loop');}}>기본값으로 초기화</button><p role="status">{storageError?'이 브라우저에 설정을 저장할 수 없어요. 미리보기는 사용할 수 있어요.':'아이콘 색상과 모션 사용 설정은 이 브라우저에 저장돼요.'}</p></section>
 </main>;
}
