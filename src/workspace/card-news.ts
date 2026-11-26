import {z} from 'zod';
import {VisualSchema} from '../core/visual';
import {SceneLayout} from '../core/scene-layout';
import {brandKitSchema,defaultBrandKit,type BrandKit} from './brand-kit';
export const cardStorageKey='shorts-studio.card-news.v1';
export const maxCardPages=20;
export const cardLayouts=['cover','body','closing'] as const;
export const cardSizes={portrait:{width:1080,height:1350},square:{width:1080,height:1080}} as const;
const pageSchema=z.object({id:z.string().uuid(),layout:z.enum(cardLayouts),title:z.string().max(100),body:z.string().max(1000),sourceSceneId:z.string().min(1).optional(),visual:VisualSchema.optional(),visualLayout:SceneLayout.optional(),mediaOmitted:z.boolean().optional()}).strict();
export type CardPage=z.infer<typeof pageSchema>;
export const cardDeckSchema=z.object({version:z.literal(1),name:z.string().trim().min(1).max(100),size:z.enum(['portrait','square']),brand:brandKitSchema,planId:z.string().uuid().optional(),source:z.object({planId:z.string().uuid(),projectId:z.string().min(1).max(64),revision:z.number().int().nonnegative()}).strict().optional(),pages:z.array(pageSchema).min(1).max(maxCardPages)}).strict().superRefine((deck,ctx)=>{if(new Set(deck.pages.map(p=>p.id)).size!==deck.pages.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'페이지 ID가 중복됐어요.'});});
export type CardDeck=z.infer<typeof cardDeckSchema>;
export function newCardDeck(id:string,brand:BrandKit=defaultBrandKit):CardDeck{return cardDeckSchema.parse({version:1,name:'새 카드뉴스',size:'portrait',brand,pages:[{id,layout:'cover',title:'',body:''}]});}
export function addCardPage(deck:CardDeck,id:string,after:string,copy=false):CardDeck{
 const i=deck.pages.findIndex(p=>p.id===after);if(i<0)throw Error('페이지를 찾지 못했어요.');
 const page:CardPage=copy?{...deck.pages[i],id}:{id,layout:'body',title:'',body:''};
 return cardDeckSchema.parse({...deck,pages:[...deck.pages.slice(0,i+1),page,...deck.pages.slice(i+1)]});
}
export function moveCardPage(deck:CardDeck,id:string,offset:-1|1):CardDeck{
 const i=deck.pages.findIndex(p=>p.id===id),j=i+offset;if(i<0||j<0||j>=deck.pages.length)return deck;
 const pages=[...deck.pages];[pages[i],pages[j]]=[pages[j],pages[i]];return {...deck,pages};
}
export function removeCardPage(deck:CardDeck,id:string):CardDeck{
 if(deck.pages.length<=1)throw Error('페이지는 한 장 이상 필요해요.');
 return cardDeckSchema.parse({...deck,pages:deck.pages.filter(p=>p.id!==id)});
}
export function parseCardDeck(raw:string){return cardDeckSchema.parse(JSON.parse(raw));}
export type CardSnapshot={raw:string|null;deck:CardDeck;error:string};
export function readCardDeck(storage:Pick<Storage,'getItem'>,fallback:CardDeck):CardSnapshot{
 let raw:string|null=null;try{raw=storage.getItem(cardStorageKey);return {raw,deck:raw===null?fallback:parseCardDeck(raw),error:''};}
 catch{return {raw,deck:fallback,error:'저장된 카드뉴스를 읽지 못했어요. 기존 데이터를 보호하기 위해 저장하지 않아요.'};}
}
export function persistCardDeck(storage:Pick<Storage,'getItem'|'setItem'>,snapshot:CardSnapshot,draft:CardDeck):CardSnapshot{
 if(snapshot.error)throw Error(snapshot.error);
 if(storage.getItem(cardStorageKey)!==snapshot.raw)throw Error('다른 탭에서 카드뉴스를 변경했어요. 새로 불러온 뒤 저장해 주세요.');
 const deck=cardDeckSchema.parse(draft),raw=JSON.stringify(deck);storage.setItem(cardStorageKey,raw);return {raw,deck,error:''};
}
// Character wrapping is deterministic for the supplied measure function, preserves explicit newlines and never silently drops text.
export function wrapCardText(text:string,maxWidth:number,measure:(text:string)=>number):string[]{
 const lines:string[]=[];for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){
  let line='';for(const char of Array.from(paragraph)){if(line&&measure(line+char)>maxWidth){lines.push(line);line='';}line+=char;}lines.push(line);
 }return lines;
}
