import {cardDeckSchema,maxCardPages,type CardDeck,type CardPage} from './card-news';
import {sharedCardBrand,type SharedContent} from './shared-content';
import {sceneLayout} from '../core/scene-layout';
// Split at a nearby word boundary when possible; never remove non-whitespace source text.
export function splitCardCopy(text:string,max=90):string[]{
 if(!Number.isInteger(max)||max<1)throw Error('잘못된 페이지 길이');
 const parts:string[]=[];let rest=text.trim();
 while(rest.length>max){let end=max;const last=rest.slice(0,max+1).lastIndexOf(' ');if(last>=Math.floor(max*.6)&&last<=max)end=last;
 if(/[\uD800-\uDBFF]/.test(rest[end-1])&&end>1)end--;parts.push(rest.slice(0,end).trim());rest=rest.slice(end).trim();}
 if(rest)parts.push(rest);return parts;
}
export function videoToCard(record:SharedContent,id:()=>string,size:CardDeck['size']='portrait'):CardDeck{
 const s=record.source;if(s?.kind!=='video')throw Error('영상 원본의 장면이 필요해요.');
 const scenes=[...s.scenes].sort((a,b)=>a.startMs-b.startMs);
 if(new Set(scenes.map(v=>v.id)).size!==scenes.length)throw Error('원본 장면 ID가 중복됐어요.');
 const groups=new Map(scenes.map(scene=>[scene.id,[] as string[]]));
 for(const caption of [...s.captions].sort((a,b)=>a.startMs-b.startMs)){
  const midpoint=(caption.startMs+caption.endMs)/2;
  const scene=scenes.find(v=>v.startMs<=midpoint&&midpoint<v.endMs);
  if(!scene)throw Error('자막과 장면의 시간 정보가 맞지 않아요. 원본을 확인해 주세요.');
  groups.get(scene.id)!.push(caption.text);
 }
 const pages:CardPage[]=[{id:id(),layout:'cover',title:s.title,body:''}];
 for(const scene of scenes){
  const body=groups.get(scene.id)!.join(' ')||scene.detail;
  const title=scene.headline.trim()||scene.kicker.trim()||s.title;
  for(const part of splitCardCopy(body).length?splitCardCopy(body):['']){
   pages.push({id:id(),layout:'body',title,body:part,sourceSceneId:scene.id,...(scene.visual?{visual:scene.visual,visualLayout:sceneLayout(scene)}:{}),...(scene.media?{mediaOmitted:true}:{})});
   if(pages.length>maxCardPages)throw Error('원본 내용을 모두 담으려면 20장보다 많은 페이지가 필요해요. 원본 영상의 장면을 줄인 뒤 다시 시도해 주세요.');
  }
 }
 return cardDeckSchema.parse({version:1,name:s.title,size,brand:sharedCardBrand(record),source:{planId:record.id,projectId:s.projectId,revision:s.revision},pages});
}
export function isSourceDeck(deck:CardDeck,record:SharedContent){return record.source?.kind==='video'&&deck.source?.planId===record.id&&deck.source.projectId===record.source.projectId&&deck.source.revision===record.source.revision;}
