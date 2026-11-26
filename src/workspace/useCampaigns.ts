import {useState} from 'react';
import {parseCampaignStore,readCampaignSnapshot,persistCampaignStore,type CampaignSnapshot,type CampaignStore} from './campaigns';
function read():CampaignSnapshot{
 try{return readCampaignSnapshot(window.localStorage);}
 catch{return {raw:null,store:parseCampaignStore(null),error:'이 브라우저에 캠페인을 저장할 수 없어요. 브라우저 설정을 확인해 주세요.'};}
}
export function useCampaigns(){
 const [snapshot,setSnapshot]=useState(read);
 const [notice,setNotice]=useState('');
 const commit=(next:()=>CampaignStore)=>{
  try{setSnapshot(persistCampaignStore(window.localStorage,snapshot,next()));setNotice('');return true;}
  catch(e){setNotice(e instanceof Error?e.message:'캠페인을 저장하지 못했어요.');return false;}
 };
 return {store:snapshot.store,error:snapshot.error||notice,readOnly:!!snapshot.error,commit,reload:()=>{setSnapshot(read());setNotice('');}};
}
