import {useState} from 'react';
import {newThread,readThread,persistThread,type ThreadSnapshot,type ThreadDeck} from './thread-news';
function read():ThreadSnapshot{const fallback=newThread(crypto.randomUUID());try{return readThread(window.localStorage,fallback);}catch{return {raw:null,deck:fallback,error:'브라우저 저장소를 사용할 수 없어요.'};}}
export function useThreads(){
 const [snapshot,setSnapshot]=useState(read),[draft,setDraft]=useState<ThreadDeck>(()=>snapshot.deck),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const dirty=JSON.stringify(draft)!==JSON.stringify(snapshot.deck);
 const change=(next:ThreadDeck)=>{setDraft(next);setNotice('');};
 const save=()=>{try{const next=persistThread(window.localStorage,snapshot,draft);setSnapshot(next);setDraft(next.deck);setError('');setNotice('스레드 초안을 저장했어요.');}catch(e){setError(e instanceof Error?e.message:'저장하지 못했어요.');setNotice('');}};
 const reload=()=>{if(dirty&&!window.confirm('저장하지 않은 스레드 변경 사항을 버릴까요?'))return;const next=read();setSnapshot(next);setDraft(next.deck);setError('');setNotice('');};
 return {draft,stored:snapshot.raw!==null&&!snapshot.error,dirty,change,save,reload,error:snapshot.error||error,readOnly:!!snapshot.error,notice};
}
