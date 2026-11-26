import {useState} from 'react';
import {useIconTheme} from '../../icons/theme/IconThemeProvider';
import {palettes} from '../../icons/theme/palettes';
import {MotionGraphic,motionNames,motionLabels,motionFormats,type MotionFormat,type MotionPlay} from '../index';
export function MotionGraphicGallery(){
 const {theme,setPalette,setColor,setMotionEnabled,reset,storageError}=useIconTheme();
 const [speed,setSpeed]=useState(1),[play,setPlay]=useState<MotionPlay>('once'),[paused,setPaused]=useState(false),[replay,setReplay]=useState(0),[individual,setIndividual]=useState<Record<string,number>>({}),[formats,setFormats]=useState<MotionFormat[]>([...motionFormats]);
 return <main className="ss-mg-lab"><header><p>SHORTS STUDIO · DESIGN SYSTEM</p><h1>Motion Graphic Design Lab</h1><p>완성의 순간을 위한 SVG 모션 그래픽. 이 화면은 디자인 시안이며 실제 제작 완료 상태가 아니에요.</p></header>
 <section className="ss-mg-controls" aria-label="모션 그래픽 설정"><label>컬러 테마 <select value={theme.paletteId} onChange={e=>setPalette(e.target.value)}>{palettes.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
 {motionFormats.map((format,i)=><label key={format}>{['숏츠','카드뉴스','스레드'][i]} 색상 <input type="color" value={theme.colors[format]} onChange={e=>setColor(format,e.target.value)}/></label>)}
 <label>재생 속도 <select value={speed} onChange={e=>setSpeed(Number(e.target.value))}>{[.5,.75,1,1.25,1.5,2].map(x=><option key={x} value={x}>{x}×</option>)}</select></label>
 <label>재생 방식 <select value={play} onChange={e=>{setPlay(e.target.value as MotionPlay);setReplay(x=>x+1);}}><option value="once">한 번</option><option value="loop">반복</option><option value="none">정지 화면</option></select></label>
 <button type="button" onClick={()=>setPaused(x=>!x)}>{paused?'계속 재생':'일시 정지'}</button><button type="button" onClick={()=>{setPaused(false);setReplay(x=>x+1);}}>모두 다시 재생</button>
 <label><input type="checkbox" checked={theme.motionEnabled} onChange={e=>setMotionEnabled(e.target.checked)}/> 애니메이션 사용</label><button type="button" onClick={()=>{reset();setSpeed(1);setPlay('once');setPaused(false);setFormats([...motionFormats]);setReplay(x=>x+1);}}>초기화</button>{storageError&&<p role="status">이 브라우저에 색상 설정을 저장할 수 없어요.</p>}</section>
 <fieldset className="ss-mg-controls"><legend>전체 완료에 포함할 콘텐츠</legend>{motionFormats.map((format,i)=><label key={format}><input type="checkbox" checked={formats.includes(format)} onChange={e=>setFormats(old=>e.target.checked?[...old,format]:old.filter(x=>x!==format))}/>{['숏츠','카드뉴스','스레드'][i]}</label>)}</fieldset>
 <section className="ss-mg-gallery">{motionNames.map(name=><article key={name} className="ss-mg-card"><MotionGraphic name={name} size={320} play={play} speed={speed} paused={paused} replayKey={replay+':'+(individual[name]??0)} formats={name==='all-content-complete'?formats:undefined}/><h2>{motionLabels[name]}</h2><p>{name==='all-content-complete'?'선택한 콘텐츠가 모두 모이는 연출':'콘텐츠의 특징을 살린 완성 연출'}</p><button type="button" onClick={()=>{setPaused(false);setIndividual(old=>({...old,[name]:(old[name]??0)+1}));}}>다시 재생</button></article>)}</section>
 </main>;
}
