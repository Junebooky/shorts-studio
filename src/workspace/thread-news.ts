import {z} from 'zod';
import type {SharedContent} from './shared-content';
export const threadStorageKey='shorts-studio.threads.v1';
export const maxThreadPosts=20,postLimit=500;
const origin=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('topic'),planId:z.string().uuid()}).strict(),
 z.object({kind:z.literal('manual'),planId:z.string().uuid()}).strict(),
 z.object({kind:z.literal('video'),planId:z.string().uuid(),projectId:z.string().regex(/^[a-zA-Z0-9-]{1,64}$/),revision:z.number().int().nonnegative()}).strict()
]);
export const threadDeckSchema=z.object({version:z.literal(1),name:z.string().max(500),source:origin.optional(),posts:z.array(z.object({id:z.string().uuid(),text:z.string().max(4000)}).strict()).min(1).max(maxThreadPosts)}).strict().superRefine((d,ctx)=>{if(new Set(d.posts.map(p=>p.id)).size!==d.posts.length)ctx.addIssue({code:z.ZodIssueCode.custom,message:'게시글 ID가 중복됐어요.'});});
export type ThreadDeck=z.infer<typeof threadDeckSchema>;
export type ThreadPost=ThreadDeck['posts'][number];
// Conservative UTF-16 budget: emoji can count more than once. Never truncate on export.
export const postLength=(text:string)=>text.length;
export const postReady=(text:string)=>!!text.trim()&&postLength(text)<=postLimit;
export const threadReady=(d:ThreadDeck)=>!!d.name.trim()&&d.posts.every(p=>postReady(p.text));
export function newThread(id:string,name='새 스레드'):ThreadDeck{return threadDeckSchema.parse({version:1,name,posts:[{id,text:''}]});}
export function splitThreadText(text:string,max=260):string[]{
 if(!Number.isInteger(max)||max<2||max>postLimit)throw Error('잘못된 게시글 길이');
 const parts:string[]=[];let remaining=text.trim();
 while(remaining.length>max){
  let cut=max;
  const window=remaining.slice(0,max+1),boundaries=[...window.matchAll(/[.!?。！？](?=\s)|\n/g)];
  const sentence=boundaries.filter(m=>m.index!+1<=max).at(-1);
  const space=window.lastIndexOf(' ');
  if(sentence&&sentence.index!+1>=Math.floor(max*.4))cut=sentence.index!+1;
  else if(space>=Math.floor(max*.6)&&space<=max)cut=space;
  if(/[\uD800-\uDBFF]/.test(remaining[cut-1]))cut--;
  parts.push(remaining.slice(0,cut).trim());remaining=remaining.slice(cut).trim();
 }
 if(remaining)parts.push(remaining);
 return parts;
}
export function sourceToThread(record:SharedContent,id:()=>string):ThreadDeck{
 const s=record.source;
 if(!s)return threadDeckSchema.parse({...newThread(id(),record.plan.topic),source:{kind:'topic',planId:record.id}});
 // Narration is authoritative; captions and generated headlines are not used to add claims.
 const parts=splitThreadText(s.script),first=parts[0];
 if(!first)throw Error('공통 원고가 비어 있어요.');
 const posts=[s.title+'\n\n'+first,...parts.slice(1)].map(text=>({id:id(),text}));
 if(posts.length>maxThreadPosts||posts.some(p=>!postReady(p.text)))throw Error('원고를 20개 이하의 게시글로 구성할 수 없어요. 원고를 나눠 주세요.');
 return threadDeckSchema.parse({version:1,name:s.title,source:s.kind==='video'?{kind:'video',planId:record.id,projectId:s.projectId,revision:s.revision}:{kind:'manual',planId:record.id},posts});
}
export function moveThreadPost(d:ThreadDeck,id:string,offset:-1|1):ThreadDeck{const i=d.posts.findIndex(p=>p.id===id),j=i+offset;if(i<0||j<0||j>=d.posts.length)return d;const posts=[...d.posts];[posts[i],posts[j]]=[posts[j],posts[i]];return {...d,posts};}
export function threadText(d:ThreadDeck){if(!threadReady(d))throw Error('게시글의 빈 내용과 글자 수를 확인해 주세요.');return d.posts.map(p=>p.text.trim()).join('\n\n---\n\n');}
export type ThreadSnapshot={raw:string|null;deck:ThreadDeck;error:string};
export function readThread(storage:Pick<Storage,'getItem'>,fallback:ThreadDeck):ThreadSnapshot{let raw:string|null=null;try{raw=storage.getItem(threadStorageKey);return {raw,deck:raw===null?fallback:threadDeckSchema.parse(JSON.parse(raw)),error:''};}catch{return {raw,deck:fallback,error:'저장된 스레드를 읽지 못했어요. 기존 데이터를 보호하기 위해 덮어쓰지 않아요.'};}}
export function persistThread(storage:Pick<Storage,'getItem'|'setItem'>,snapshot:ThreadSnapshot,draft:ThreadDeck):ThreadSnapshot{if(snapshot.error)throw Error(snapshot.error);if(storage.getItem(threadStorageKey)!==snapshot.raw)throw Error('다른 탭에서 스레드를 변경했어요. 다시 불러온 뒤 저장해 주세요.');const deck=threadDeckSchema.parse(draft),raw=JSON.stringify(deck);storage.setItem(threadStorageKey,raw);return {raw,deck,error:''};}
