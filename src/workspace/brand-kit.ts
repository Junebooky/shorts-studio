import {z} from 'zod';
export const brandStorageKey='shorts-studio.brand-kit.v1';
export const maxLogoBytes=256*1024;
export const brandFonts=['sans','serif','mono'] as const;
export const brandTones=['friendly','professional','energetic','calm'] as const;
export const brandStyles=['minimal','editorial','bold'] as const;
const hex=z.string().regex(/^#[0-9a-fA-F]{6}$/);
const logo=z.string().max(4*Math.ceil(maxLogoBytes/3)+40).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/).nullable();
export const brandKitSchema=z.object({
 version:z.literal(1),name:z.string().trim().max(100),
 primary:hex,accent:hex,background:hex,foreground:hex,
 font:z.enum(brandFonts),tone:z.enum(brandTones),style:z.enum(brandStyles),
 guidelines:z.string().trim().max(1000),logo,
}).strict();
export type BrandKit=z.infer<typeof brandKitSchema>;
export const defaultBrandKit:BrandKit={version:1,name:'',primary:'#1E60F3',accent:'#1346D8',background:'#F8FAFC',foreground:'#0F172A',font:'sans',tone:'professional',style:'minimal',guidelines:'',logo:null};
export type BrandSnapshot={raw:string|null;kit:BrandKit;error:string};
export function parseBrandKit(raw:string|null):BrandKit{return raw===null?{...defaultBrandKit}:brandKitSchema.parse(JSON.parse(raw));}
export function readBrandKit(storage:Pick<Storage,'getItem'>):BrandSnapshot{
 let raw:string|null=null;
 try{raw=storage.getItem(brandStorageKey);return {raw,kit:parseBrandKit(raw),error:''};}
 catch{return {raw,kit:{...defaultBrandKit},error:'저장된 브랜드를 읽지 못했어요. 기존 데이터를 보호하기 위해 저장하지 않아요.'};}
}
export function persistBrandKit(storage:Pick<Storage,'getItem'|'setItem'>,snapshot:BrandSnapshot,draft:BrandKit):BrandSnapshot{
 if(snapshot.error)throw new Error(snapshot.error);
 if(storage.getItem(brandStorageKey)!==snapshot.raw)throw new Error('다른 탭에서 브랜드를 변경했어요. 새로 불러온 뒤 저장해 주세요.');
 const kit=brandKitSchema.parse(draft),raw=JSON.stringify(kit);storage.setItem(brandStorageKey,raw);return {raw,kit,error:''};
}
function luminance(color:string){
 const channels=color.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
}
export function contrastRatio(a:string,b:string){const x=luminance(hex.parse(a)),y=luminance(hex.parse(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function readableInk(color:string){return contrastRatio(color,'#FFFFFF')>=contrastRatio(color,'#0F172A')?'#FFFFFF':'#0F172A';}
export function validateLogoFile(file:{type:string;size:number}){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('PNG, JPG 또는 WebP 파일만 사용할 수 있어요.');
 if(file.size<=0||file.size>maxLogoBytes)throw new Error('256KB 이하의 로고를 선택해 주세요.');
}
