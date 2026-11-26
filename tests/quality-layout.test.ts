import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectLayout,LayoutSample,type Rect} from '../src/core/quality/layout';
const canvas={left:0,top:0,right:1080,bottom:1920},safe={left:72,top:180,right:906,bottom:1480};
const box=(left:number,top:number,right:number,bottom:number):Rect=>({left,top,right,bottom});
const element=(role:string,rect:Rect,clip:Rect|null=null)=>({role,rects:[rect],clip});
test('safe separated critical text passes geometry only',()=>assert.deepEqual(inspectLayout({frame:9,elements:[element('headline',box(100,200,800,400)),element('caption',box(100,1300,800,1400))]},safe,canvas,['headline','caption']),[]));
test('safe-area, clipped text and intersecting critical text have frame evidence',()=>{
 const findings=inspectLayout({frame:12,elements:[element('headline',box(60,200,500,300)),element('caption',box(400,250,1000,320),box(0,0,900,1920))]},safe,canvas,['headline','caption']);
 assert.deepEqual(findings.map(x=>x.code),['unsafe','overlap','unsafe','clipped']);assert.ok(findings.every(x=>x.frame===12&&x.rect));
});
test('missing marks and invalid geometry cannot masquerade as pass',()=>{
 assert.deepEqual(inspectLayout({frame:1,elements:[]},safe,canvas,['caption']),[{code:'missing',frame:1,roles:['caption']}]);
 assert.equal(LayoutSample.safeParse({frame:1,elements:[element('caption',box(0,0,0,1))]}).success,false);
});
