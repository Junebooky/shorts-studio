import {test} from 'node:test';import assert from 'node:assert/strict';
import {brandStorageKey,defaultBrandKit,parseBrandKit,readBrandKit,persistBrandKit,contrastRatio,readableInk,validateLogoFile,maxLogoBytes} from '../src/workspace/brand-kit';
test('brand schema and contrast checks',()=>{
 assert.deepEqual(parseBrandKit(null),defaultBrandKit);
 assert.equal(contrastRatio('#000000','#FFFFFF'),21);
 assert.equal(contrastRatio('#FFFFFF','#FFFFFF'),1);
 assert.equal(readableInk('#000000'),'#FFFFFF');
 assert.equal(readableInk('#FFFFFF'),'#0F172A');
 assert.throws(()=>parseBrandKit(JSON.stringify({...defaultBrandKit,primary:'red'})));
 assert.throws(()=>parseBrandKit(JSON.stringify({...defaultBrandKit,logo:'data:image/svg+xml;base64,AAAA'})));
 assert.throws(()=>validateLogoFile({type:'image/svg+xml',size:100}));
 assert.throws(()=>validateLogoFile({type:'image/png',size:maxLogoBytes+1}));
 assert.doesNotThrow(()=>validateLogoFile({type:'image/webp',size:256}));
});
test('brand persistence does not overwrite corrupt data or other-tab changes',()=>{
 const map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v)}};
 const initial=readBrandKit(storage),draft={...defaultBrandKit,name:'테스트 브랜드',primary:'#123456',tone:'friendly' as const};
 const saved=persistBrandKit(storage,initial,draft);
 assert.deepEqual(readBrandKit(storage).kit,draft);
 assert.throws(()=>persistBrandKit(storage,initial,draft),/다른 탭/);
 assert.throws(()=>persistBrandKit({...storage,setItem:()=>{throw new Error('quota')}},saved,draft),/quota/);
 map.set(brandStorageKey,'broken');const broken=readBrandKit(storage);assert.ok(broken.error);
 assert.throws(()=>persistBrandKit(storage,broken,draft));assert.equal(map.get(brandStorageKey),'broken');
});
