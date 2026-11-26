import {test} from 'node:test';import assert from 'node:assert/strict';
import {newCardDeck,addCardPage,moveCardPage,removeCardPage,cardStorageKey,readCardDeck,persistCardDeck,parseCardDeck,wrapCardText,maxCardPages} from '../src/workspace/card-news';
const id=(n:number)=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
test('card page operations preserve identity, order, original data and limits',()=>{
 const a=newCardDeck(id(1)),b=addCardPage(a,id(2),id(1)),c=addCardPage(b,id(3),id(1),true);
 assert.equal(a.pages.length,1);assert.deepEqual(c.pages.map(p=>p.id),[id(1),id(3),id(2)]);
 assert.equal(c.pages[1].layout,'cover');assert.deepEqual(moveCardPage(c,id(2),-1).pages.map(p=>p.id),[id(1),id(2),id(3)]);
 assert.equal(removeCardPage(c,id(3)).pages.length,2);assert.throws(()=>removeCardPage(a,id(1)));
 assert.throws(()=>addCardPage(a,id(1),id(1)));
 let full=a;for(let n=2;n<=maxCardPages;n++)full=addCardPage(full,id(n),id(n-1));
 assert.throws(()=>addCardPage(full,id(21),id(20)));assert.deepEqual(parseCardDeck(JSON.stringify(c)),c);
});
test('card storage rejects stale and corrupt data',()=>{
 const a=newCardDeck(id(1)),map=new Map<string,string>(),storage={getItem:(k:string)=>map.get(k)??null,setItem:(k:string,v:string)=>{map.set(k,v)}};
 const initial=readCardDeck(storage,a),next={...a,name:'테스트 카드뉴스'},saved=persistCardDeck(storage,initial,next);
 assert.deepEqual(readCardDeck(storage,a).deck,next);assert.throws(()=>persistCardDeck(storage,initial,next),/다른 탭/);
 assert.throws(()=>persistCardDeck({...storage,setItem:()=>{throw Error('quota')}},saved,next));
 map.set(cardStorageKey,'broken');assert.throws(()=>persistCardDeck(storage,readCardDeck(storage,a),next));assert.equal(map.get(cardStorageKey),'broken');
});
test('wrapping preserves Korean, line breaks and all characters',()=>{
 assert.deepEqual(wrapCardText('가나다라\n마바\n',2,s=>Array.from(s).length),['가나','다라','마바','']);
 assert.deepEqual(wrapCardText('😀한글',2,s=>Array.from(s).length),['😀한','글']);
});
