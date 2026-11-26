import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demo,type Project} from '../src/core/project';
import {effectiveTheme} from '../src/core/styles';
import {createMasterContent,masterCardProps,masterSizes,threadDraft} from '../src/workspace/master-content';
test('one source shares the original scene, theme and exact captions across formats',()=>{
 const p:Project=structuredClone(demo);p.id='master-test';p.revision=7;p.scenes[0].visual={type:'path',labels:['원본','소재','출력']};p.styleId='editorial';
 const before=structuredClone(p),m=createMasterContent(p),id=p.scenes[0].id;
 assert.equal(m.projectId,p.id);assert.equal(m.revision,7);assert.deepEqual(m.theme,effectiveTheme(p));
 const a=masterCardProps(m,id,'portrait'),b=masterCardProps(m,id,'square');
 assert.deepEqual(a.entry,b.entry);assert.deepEqual(a.theme,b.theme);assert.deepEqual(a.entry.scene.visual,p.scenes[0].visual);
 assert.deepEqual(masterSizes.portrait,{width:1080,height:1350});assert.deepEqual(masterSizes.square,{width:1080,height:1080});
 assert.equal(a.entry.frame,a.entry.durationInFrames-1);assert.equal(threadDraft(m)[0].sceneId,id);
 assert.ok(threadDraft(m)[0].text.includes(p.captions[0].text));assert.deepEqual(p,before);
 assert.throws(()=>masterCardProps(m,'missing','portrait'));
});
test('only media actually placed in a source scene is reused; reference cannot be promoted',()=>{
 const p:Project=structuredClone(demo);p.id='master-test';
 const id='11111111-1111-4111-8111-111111111111',unused='22222222-2222-4222-8222-222222222222';
 const asset={id,path:'workspace/'+p.id+'/assets/'+id+'.png',name:'original',kind:'image' as const,role:'production' as const,bytes:12,sha256:'a'.repeat(64),notes:''};
 p.assets=[asset,{...asset,id:unused,path:'workspace/'+p.id+'/assets/'+unused+'.png',role:'reference'}];
 p.scenes[0].media={assetId:id,fit:'contain',offsetMs:0};
 const m=createMasterContent(p);assert.deepEqual(m.scenes[0].asset,asset);assert.ok(m.scenes.slice(1).every(s=>!s.asset));
 p.scenes[0].media.assetId=unused;assert.throws(()=>createMasterContent(p));
});
