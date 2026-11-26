import {useState} from 'react';
import {defaultBrandKit,readBrandKit,persistBrandKit,type BrandKit,type BrandSnapshot} from './brand-kit';
function read():BrandSnapshot{
 try{return readBrandKit(window.localStorage);}
 catch{return {raw:null,kit:{...defaultBrandKit},error:'이 브라우저에 설정을 저장할 수 없어요. 브라우저 설정을 확인해 주세요.'};}
}
export function useBrandKit(){
 const [snapshot,setSnapshot]=useState(read);
 const [draft,setDraft]=useState<BrandKit>(()=>snapshot.kit);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const dirty=JSON.stringify(draft)!==JSON.stringify(snapshot.kit);
 const save=()=>{try{const next=persistBrandKit(window.localStorage,snapshot,draft);setSnapshot(next);setDraft(next.kit);setError('');setNotice('브랜드 설정을 저장했어요.');}catch(e){setError(e instanceof Error?e.message:'브랜드를 저장하지 못했어요.');setNotice('');}};
 const change=(patch:Partial<BrandKit>)=>{setDraft(old=>({...old,...patch}));setNotice('');};
 const reload=()=>{if(dirty&&!window.confirm('저장하지 않은 브랜드 설정이 사라져요. 계속할까요?'))return;const next=read();setSnapshot(next);setDraft(next.kit);setError('');setNotice('');};
 return {saved:snapshot.kit,draft,dirty,change,save,reload,notice,error:snapshot.error||error,readOnly:!!snapshot.error};
}
