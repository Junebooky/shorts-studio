import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement,Fragment} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AnimatedIcon} from '../src/design-system/icons/AnimatedIcon';
import {iconNames} from '../src/design-system/icons/types';
test('all icons render vector markup and are decorative by default',()=>{
 for(const name of iconNames){const s=renderToStaticMarkup(createElement(AnimatedIcon,{name,size:24}));assert.match(s,/<svg/);assert.match(s,/viewBox="0 0 96 96"/);assert.match(s,/width="24"/);assert.match(s,/aria-hidden="true"/);assert.match(s,/data-motion="none"/);assert.doesNotMatch(s,/<image|<script/);assert.match(s,/--ss-icon-ink:#FFFFFF/);}
});
test('explicit label, override and animation state',()=>{
 const s=renderToStaticMarkup(createElement(AnimatedIcon,{name:'shorts',label:'숏츠',color:'#abcdef',motion:'hover',active:true}));
 assert.match(s,/role="img"/);assert.match(s,/aria-label="숏츠"/);assert.match(s,/--ss-icon-base:#ABCDEF/);assert.match(s,/data-motion="hover"/);assert.match(s,/data-active="true"/);assert.doesNotMatch(s,/aria-hidden/);
});

test('reels instances use unique local gradient ids and exact uploaded path',()=>{
 const s=renderToStaticMarkup(createElement(Fragment,null,createElement(AnimatedIcon,{name:'shorts'}),createElement(AnimatedIcon,{name:'shorts'})));
 const ids=[...s.matchAll(/<linearGradient id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,2);assert.notEqual(ids[0],ids[1]);
 for(const id of ids)assert.equal(s.split('url(#'+id+')').length-1,2);
 assert.match(s,/--ss-icon-gradient-start:#FFAC39/);assert.match(s,/--ss-icon-gradient-middle:#F42972/);assert.match(s,/--ss-icon-gradient-end:#8245F5/);
 assert.match(s,/class="ss-icon-clap"/);assert.match(s,/M41 36 Q38 34 38 38 V58 Q38 62 42 60 L59 50 Q62 48 59 46 Z/);
});

test('approved rocket artwork keeps white points and exact original geometry',()=>{
 const s=renderToStaticMarkup(createElement(AnimatedIcon,{name:'coming-soon',size:80,motion:'hover',active:true}));
 assert.match(s,/data-icon="coming-soon"/);assert.match(s,/--ss-rocket-body:#6674E8/);assert.match(s,/--ss-rocket-flame:#F4A34B/);assert.match(s,/--ss-icon-ink:#FFFFFF/);
 assert.match(s,/M48 10Q25 28 32 57L39 70H57L64 57Q71 28 48 10Z/);assert.match(s,/class="ss-icon-rocket-body"/);assert.match(s,/data-active="true"/);
});
