import {useState,type ReactNode} from 'react';
import {Button,Card,inputClass} from '../design-system/components';
import {newThread,maxThreadPosts,postLength,postLimit,postReady,threadReady,moveThreadPost,threadText} from './thread-news';
import type {useThreads} from './useThreads';
export function ThreadStudio({studio,sourcePanel}:{studio:ReturnType<typeof useThreads>;sourcePanel?:ReactNode}){
 const {draft,dirty,change,save,reload,error,readOnly,notice}=studio;
 const [feedback,setFeedback]=useState('');
 const ready=threadReady(draft),validCount=draft.posts.filter(p=>postReady(p.text)).length;
 const copy=async(text:string)=>{try{await navigator.clipboard.writeText(text);setFeedback('복사했어요. Threads에 붙여넣어 주세요.');}catch{setFeedback('복사하지 못했어요. 게시글 내용을 직접 선택해 복사해 주세요.');}};
 const exportText=()=>{if(!ready)return;const url=URL.createObjectURL(new Blob([threadText(draft)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=(draft.name.trim()||'스레드').replace(/[\\/:*?"<>|]/g,'_')+'.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <main className="marketing-module thread-studio">
 <div className="marketing-home-heading"><div><p className="text-sm font-medium text-cobalt">스레드 제작</p><h1 className="text-3xl font-bold tracking-tight mt-2">스레드 스튜디오</h1><p className="text-sm text-slate-600 mt-3">하나의 이야기를 이어지는 게시글로 구성해 보세요.</p></div><div className="flex flex-wrap items-center gap-3"><span className="text-xs text-slate-500">{dirty?'저장하지 않은 변경 사항':'저장된 변경 사항 없음'}</span><Button disabled={readOnly||!dirty} onClick={save}>스레드 초안 저장</Button></div></div>
 <p className="text-sm text-slate-600">이 브라우저에 초안 한 개를 저장해요. 게시글을 복사하거나 텍스트 파일로 저장할 수 있지만 자동 발행하지 않아요.</p>
 {error&&<div role="alert" className="bg-rose-50 rounded-xl p-4 space-y-3 text-sm text-rose-800"><p>{error}</p><Button variant="secondary" onClick={reload}>스레드 다시 불러오기</Button></div>}
 {notice&&<p role="status" className="text-sm text-emerald-700">{notice}</p>}
 {sourcePanel}
 <Card className="space-y-4"><label className="block text-sm font-medium">스레드 이름<input aria-label="스레드 이름" className={inputClass+' mt-2'} value={draft.name} maxLength={500} onChange={e=>change({...draft,name:e.target.value})}/></label>
 {draft.source&&<p className="text-xs text-slate-600">{draft.source.kind==='video'?'영상 원본 리비전 '+draft.source.revision+'에서 구성한 초안':draft.source.kind==='manual'?'공통 원고에서 구성한 초안':'공통 주제 · 직접 작성하는 초안'} · 발행 전 내용을 확인해 주세요.</p>}
 <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold text-sm">게시글 {draft.posts.length}개 · 글자 수 통과 {validCount}개</p><Button variant="secondary" onClick={()=>{if(window.confirm('현재 스레드 초안을 새 작업으로 교체할까요? 저장하기 전까지 기존 저장본은 유지돼요.'))change(newThread(crypto.randomUUID()));}}>새 스레드</Button></div>
 </Card>
 <div className="thread-sequence">{draft.posts.map((p,i)=><div className="thread-post-row" key={p.id}><div className="thread-post-index" aria-hidden="true"><span>{i+1}</span></div><Card className="space-y-4 min-w-0"><div className="flex items-center justify-between gap-3 flex-wrap"><h2 className="font-semibold text-sm">게시글 {i+1}</h2><span className={'text-xs font-medium tabular-nums '+(postLength(p.text)>postLimit?'text-rose-700':'text-slate-500')}>{postLength(p.text)} / {postLimit}자</span></div>
 <textarea aria-label={'게시글 '+(i+1)+' 내용'} className={inputClass+' resize-y leading-relaxed'} rows={5} maxLength={4000} value={p.text} placeholder="이어서 전달할 내용을 작성해 보세요." onChange={e=>change({...draft,posts:draft.posts.map(x=>x.id===p.id?{...x,text:e.target.value}:x)})}/>
 {!postReady(p.text)&&<p className="text-xs text-rose-700">{p.text.trim()?'500자 이내로 줄여 주세요.':'게시글 내용을 입력해 주세요.'}</p>}
 <div className="flex flex-wrap items-center gap-2"><Button variant="ghost" disabled={i===0} aria-label={'게시글 '+(i+1)+' 앞으로 이동'} onClick={()=>change(moveThreadPost(draft,p.id,-1))}>위로</Button><Button variant="ghost" disabled={i===draft.posts.length-1} aria-label={'게시글 '+(i+1)+' 뒤로 이동'} onClick={()=>change(moveThreadPost(draft,p.id,1))}>아래로</Button><Button variant="ghost" disabled={draft.posts.length===1} aria-label={'게시글 '+(i+1)+' 삭제'} onClick={()=>{if(window.confirm('이 게시글을 삭제할까요?'))change({...draft,posts:draft.posts.filter(x=>x.id!==p.id)});}}>삭제</Button><div className="flex-1"/><Button variant="secondary" disabled={!postReady(p.text)} aria-label={'게시글 '+(i+1)+' 복사'} onClick={()=>void copy(p.text.trim())}>복사</Button></div></Card></div>)}</div>
 <div className="flex flex-wrap gap-3"><Button variant="secondary" disabled={draft.posts.length>=maxThreadPosts} onClick={()=>change({...draft,posts:[...draft.posts,{id:crypto.randomUUID(),text:''}]})}>게시글 추가</Button></div>
 <Card className="space-y-3"><h2 className="text-lg font-semibold">검수 및 내보내기</h2><p className="text-sm text-slate-600">일반 게시글은 최대 500자예요. 이모지는 보수적으로 계산하며, 글자 수 검사는 사실 확인이나 발행 승인이 아니에요.</p><p className="text-sm text-slate-600">{ready?'모든 게시글의 글자 수 검사를 통과했어요.':'이름과 모든 게시글의 내용을 확인해 주세요.'}</p><div className="flex flex-wrap gap-3"><Button disabled={!ready} onClick={()=>void copy(threadText(draft))}>전체 복사</Button><Button variant="secondary" disabled={!ready} onClick={exportText}>텍스트 다운로드</Button></div><p className="text-xs text-slate-500">전체 복사와 파일은 게시글 사이를 구분선으로 나눠요. 실제 발행은 Threads에서 한 글씩 진행해 주세요.</p>{feedback&&<p role="status" className="text-sm text-slate-600">{feedback}</p>}</Card>
 </main>;
}
