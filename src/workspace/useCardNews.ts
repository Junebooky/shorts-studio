import {useState} from 'react';
import {newCardDeck,readCardDeck,persistCardDeck,type CardDeck,type CardSnapshot} from './card-news';
function read():CardSnapshot{
 const fallback=newCardDeck(crypto.randomUUID());
 try{return readCardDeck(window.localStorage,fallback);}
 catch{return {raw:null,deck:fallback,error:'이 브라우저에서 로컬 저장소를 사용할 수 없어요.'};}
}
export function useCardNews(){
 const [snapshot,setSnapshot]=useState(read);
 const [draft,setDraft]=useState<CardDeck>(()=>snapshot.deck);
 const [selectedId,setSelectedId]=useState(()=>snapshot.deck.pages[0].id);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const dirty=JSON.stringify(draft)!==JSON.stringify(snapshot.deck);
 const selected=draft.pages.find(p=>p.id===selectedId)??draft.pages[0];
 const change=(next:CardDeck,id?:string)=>{setDraft(next);if(id)setSelectedId(id);setNotice('');};
 const save=()=>{try{const next=persistCardDeck(window.localStorage,snapshot,draft);setSnapshot(next);setDraft(next.deck);setError('');setNotice('카드뉴스를 저장했어요.');return true;}catch(e){setError(e instanceof Error?e.message:'카드뉴스를 저장하지 못했어요.');setNotice('');return false;}};
 const reload=()=>{if(dirty&&!window.confirm('저장하지 않은 카드뉴스 변경 사항을 버릴까요?'))return;const next=read();setSnapshot(next);setDraft(next.deck);setSelectedId(next.deck.pages[0].id);setError('');setNotice('');};
 return {saved:snapshot.raw===null||snapshot.error?null:snapshot.deck,draft,selected,select:setSelectedId,dirty,change,save,reload,notice,error:snapshot.error||error,readOnly:!!snapshot.error};
}
