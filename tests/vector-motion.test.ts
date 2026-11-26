import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {VectorSchema,pathPoints,vectorErrors,assertVectorCues,vectorSignature} from '../src/core/vector-motion';
import {VisualSchema} from '../src/core/visual';
import {assertMotionVariety} from '../src/core/semantic-motion';
import {EditorialGraphicState} from '../src/engine/EditorialGraphic';
import {VectorGraphicState,vectorProgress} from '../src/engine/VectorGraphic';
import {demo} from '../src/core/project';
import {vectorScenes} from './fixtures/vector-motion';
test('model-defined object contours and curves share one bounded schema and palette',()=>{
 for(const v of vectorScenes){assert.deepEqual(VisualSchema.parse(v),v);assert.deepEqual(vectorErrors(v),[]);assert.doesNotThrow(()=>assertVectorCues(v,[{slot:0}]));const html=renderToStaticMarkup(createElement(EditorialGraphicState,{visual:v,theme:demo.theme}));assert.ok(html.includes('data-vector-subject'));assert.ok(html.includes(demo.theme.accent));assert.ok(html.includes('stroke-dashoffset="0"')||html.includes('rotate(0'));assert.ok(!html.includes('<script'));}
});
test('reject arbitrary SVG, unsafe coordinates, invisible and invalid paths',()=>{
 for(const bad of ['<svg onload="alert(1)">','M 50 50 L 900 60','M 50 50 H 80','M 50 50 L 50 50','M 50 50 C 100 100 200 200','M 50 50 L 80 80 url(x)'])assert.throws(()=>pathPoints(bad));
 const v=structuredClone(vectorScenes[0]);v.layers[0].paths[0].d='M 50 50 L 900 60';assert.throws(()=>VectorSchema.parse(v));
 const hidden=structuredClone(vectorScenes[0]);hidden.layers[0].paths[0].fill='none';hidden.layers[0].paths[0].stroke='none';assert.throws(()=>VectorSchema.parse(hidden));
});
test('bounds, cues and duplicate geometry prevent unsafe or decorative motion',()=>{
 const v=structuredClone(vectorScenes[0]);v.layers[1].motion={kind:'translate',slot:0,dx:-800,dy:0};assert.ok(vectorErrors(v).some(s=>s.includes('안전 영역')));assert.throws(()=>assertVectorCues(v,[{slot:0}]));
 assert.throws(()=>assertVectorCues(vectorScenes[1],[]));assert.throws(()=>assertVectorCues(vectorScenes[1],[{slot:1}]));
 const same={...vectorScenes[0],subject:'이름만 변경',labels:[]};assert.equal(vectorSignature(same),vectorSignature(vectorScenes[0]));
 assert.throws(()=>assertMotionVariety([0,1,2].map(i=>({visual:same,cues:[{slot:0}],startMs:i*5000,endMs:(i+1)*5000})),15000));
 assert.doesNotThrow(()=>assertMotionVariety(vectorScenes.map((visual,i)=>({visual,cues:[{slot:0}],startMs:i*5000,endMs:(i+1)*5000})),15000));
});
test('motion starts only at evidence frame and final state matches static card renderer',()=>{
 assert.equal(vectorProgress(9,10,30),0);assert.equal(vectorProgress(10,10,30),0);assert.equal(vectorProgress(20,10,30),.5);assert.equal(vectorProgress(30,10,30),1);
 const v=vectorScenes[1],html=(t:number)=>renderToStaticMarkup(createElement(VectorGraphicState,{visual:v,theme:demo.theme,progress:()=>t}));
 assert.notEqual(html(0),html(.5));assert.notEqual(html(.5),html(1));
 assert.equal(html(1),renderToStaticMarkup(createElement(EditorialGraphicState,{visual:v,theme:demo.theme})));
});
