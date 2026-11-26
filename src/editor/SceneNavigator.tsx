import {useEffect,useState,type RefObject} from 'react';
import type {PlayerRef} from '@remotion/player';
import {ChevronLeft,ChevronRight,Film,MessageSquareText,Pencil,ScanLine} from 'lucide-react';
import {Button} from '../design-system/components';
import {sceneLabels} from '../copy/labels';
import {frames,type Project} from '../core/project';
import {boundedFrame,captionSeekFrame,formatSceneTime,frameTime,sceneCaptions,sceneIndexAtFrame,sceneStartFrame} from './scene-navigation';

const visualLabels={mechanism:'동작 원리',semiconductor:'반도체 공정',path:'흐름',contrast:'비교',cycle:'순환',focus:'핵심 강조',typography:'글자 중심'} as const;
export function SceneNavigator({project,player,editDisabled,onEdit,onSceneChange,showDetails=true}:{showDetails?:boolean;project:Project;player:RefObject<PlayerRef|null>;editDisabled:boolean;onEdit:(index:number)=>void;onSceneChange?:(index:number)=>void}){
 const [frame,setFrame]=useState(0);
 useEffect(()=>{
  const instance=player.current;if(!instance)return;
  const sync=()=>setFrame(boundedFrame(project,instance.getCurrentFrame()));
  sync();instance.addEventListener('frameupdate',sync);instance.addEventListener('seeked',sync);
  return ()=>{instance.removeEventListener('frameupdate',sync);instance.removeEventListener('seeked',sync);};
 },[player,project.id,project.durationMs]);
 const current=boundedFrame(project,frame),index=sceneIndexAtFrame(project,current),scene=project.scenes[index];
 useEffect(()=>{onSceneChange?.(index);},[index,onSceneChange]);
 const captions=sceneCaptions(project,index),total=project.scenes.length;
 const seek=(next:number|null)=>{if(next===null||!player.current)return;player.current.pause();player.current.seekTo(next);setFrame(next);};
 const go=(i:number)=>seek(sceneStartFrame(project,i));
 const currentMs=frameTime(current);
 return <section className="space-y-3" aria-label="장면 이동 및 확인" data-testid="scene-navigator">
  <div className="flex items-center justify-between gap-2 flex-wrap"><h3 className="text-sm font-semibold flex items-center gap-2"><Film size={17} className="text-cobalt"/>장면별 보기</h3><span className="text-xs text-slate-500 tabular-nums">{formatSceneTime(currentMs)} / {formatSceneTime(project.durationMs)}</span></div>
  {!total?<p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">장면을 만들면 원하는 위치로 이동해 자막을 확인할 수 있어요.</p>:<>
   <div className="relative h-10 rounded-lg bg-slate-100 overflow-hidden" aria-label="영상 장면 타임라인">
    {project.scenes.map((s,i)=><button type="button" key={s.id} aria-label={'타임라인 장면 '+(i+1)} aria-current={index===i?'step':undefined} title={s.headline} className={'absolute h-full rounded-md text-xs px-2 truncate text-left '+(index===i?'bg-cobalt text-white':'bg-blue-100 hover:bg-blue-200 text-blue-800')} style={{left:100*s.startMs/project.durationMs+'%',width:100*(s.endMs-s.startMs)/project.durationMs+'%'}} onClick={()=>go(i)}>{i+1}. {s.headline}</button>)}
    <div aria-hidden="true" className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-slate-950 shadow-[0_0_2px_white]" style={{left:100*current/Math.max(1,frames(project))+'%'}}/>
   </div>
   <div className="flex items-center justify-between gap-2"><Button variant="ghost" className="!px-2.5" aria-label="이전 장면" disabled={index<=0} onClick={()=>go(index-1)}><ChevronLeft size={17}/></Button><span className="text-xs font-semibold text-slate-700 tabular-nums" data-testid="scene-position">{index<0?'장면 사이':(index+1)+' / '+total+' 장면'}</span><Button variant="ghost" className="!px-2.5" aria-label="다음 장면" disabled={index>=total-1} onClick={()=>go(index+1)}><ChevronRight size={17}/></Button></div>
   <div className="max-h-44 overflow-y-auto space-y-1 p-1" role="group" aria-label="장면 목록">
    {project.scenes.map((s,i)=><button type="button" key={s.id} aria-label={'장면 '+(i+1)+'로 이동'} aria-current={index===i?'step':undefined} className={'w-full flex items-start gap-2 text-left rounded-xl p-2.5 transition-colors '+(index===i?'bg-blue-50 text-cobalt':'bg-slate-50 hover:bg-slate-100 text-slate-700')} onClick={()=>go(i)}><span className={'rounded-lg w-7 h-7 shrink-0 grid place-items-center text-xs font-semibold '+(index===i?'bg-cobalt text-white':'bg-white text-slate-600')}>{i+1}</span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold whitespace-pre-line break-words">{s.headline||'제목 없는 장면'}</span><span className="block text-[11px] mt-1 text-slate-500 tabular-nums">{formatSceneTime(s.startMs)} – {formatSceneTime(s.endMs)}</span></span></button>)}
   </div>
   {showDetails&&(scene?<div className="rounded-2xl bg-slate-50 p-3 space-y-3" data-testid="current-scene-detail">
    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-xs font-semibold text-cobalt">현재 장면 · {sceneLabels[scene.kind]}</p><h4 className="text-sm font-semibold mt-1 break-words whitespace-pre-line">{scene.headline||'제목 없는 장면'}</h4></div><Button variant="secondary" className="!px-2.5 shrink-0" disabled={editDisabled} onClick={()=>onEdit(index)}><Pencil size={14}/>이 장면 편집</Button></div>
    {project.id==='demo'&&<p className="text-xs text-slate-500">데모를 복제하면 장면을 편집할 수 있어요.</p>}
    <div className="space-y-1.5 text-xs"><p className="flex gap-1.5 items-center font-semibold text-slate-700"><ScanLine size={15}/>장면 구성</p><p className="text-slate-600">{scene.visual?visualLabels[scene.visual.type]:'기본 장면 연출'}{scene.media?' · 제작 소재 사용':''}</p>{scene.intent&&<><p className="break-words"><span className="text-slate-500">목적 · </span>{scene.intent.purpose}</p><p className="break-words"><span className="text-slate-500">표현 · </span>{scene.intent.metaphor}</p></>}{!!scene.cues?.length&&<p className="text-slate-500">음성에 맞춘 움직임 {scene.cues.length}개</p>}</div>
    <div className="space-y-1.5" data-testid="scene-caption-list"><p className="flex gap-1.5 items-center text-xs font-semibold text-slate-700"><MessageSquareText size={15}/>이 장면의 자막 · {captions.length}개</p>{!captions.length&&<p className="text-xs text-slate-500">이 장면에 표시되는 자막이 없어요.</p>}{captions.map(c=>{const target=captionSeekFrame(project,index,c.id),active=currentMs>=c.startMs&&currentMs<c.endMs;return <button type="button" key={c.id} aria-label={'자막 위치로 이동: '+c.text} aria-current={active?'true':undefined} disabled={target===null} onClick={()=>seek(target)} className={'block w-full rounded-lg p-2 text-left text-xs disabled:opacity-50 '+(active?'bg-blue-100 text-blue-900':'bg-white text-slate-700 hover:bg-blue-50')}><span className="block text-[10px] text-slate-500 tabular-nums">{formatSceneTime(c.startMs)} – {formatSceneTime(c.endMs)}</span><span className="block mt-1 break-words">{c.text}</span></button>;})}</div>
   </div>:<p className="text-xs text-slate-500">현재 위치에 해당하는 장면이 없어요.</p>)}
  </>}
 </section>;
}
