import {useRef,useState} from 'react';
import {readSharedContent,persistSharedContent,type SharedContent,type SharedSnapshot} from './shared-content';
function read():SharedSnapshot{try{return readSharedContent(window.localStorage);}catch{return {raw:null,record:null,error:'이 브라우저에서 공통 원본 저장소를 사용할 수 없어요.'};}}
export function useSharedContent(){
 const [snapshot,setSnapshot]=useState(read),ref=useRef(snapshot);
 const [error,setError]=useState('');
 const commit=(record:SharedContent)=>{try{const next=persistSharedContent(window.localStorage,ref.current,record);ref.current=next;setSnapshot(next);setError('');return true;}catch(e){setError(e instanceof Error?e.message:'공통 원본을 저장하지 못했어요.');return false;}};
 const reload=()=>{const next=read();ref.current=next;setSnapshot(next);setError('');return next.record;};
 return {record:snapshot.record,current:()=>ref.current.record,error:snapshot.error||error,readOnly:!!snapshot.error,commit,reload};
}
