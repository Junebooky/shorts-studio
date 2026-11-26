import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AnimatedIcon} from '../src/design-system/icons/AnimatedIcon';
import {iconNames} from '../src/design-system/icons/types';
test('all icons render vector markup and are decorative by default',()=>{
 for(const name of iconNames){const s=renderToStaticMarkup(createElement(AnimatedIcon,{name,size:24}));assert.match(s,/<svg/);assert.match(s,/viewBox="0 0 96 96"/);assert.match(s,/width="24"/);assert.match(s,/aria-hidden="true"/);assert.match(s,/data-motion="none"/);assert.doesNotMatch(s,/<image|<script|id="/);}
});
test('explicit label, override and animation state',()=>{
 const s=renderToStaticMarkup(createElement(AnimatedIcon,{name:'shorts',label:'숏츠',color:'#abcdef',motion:'hover',active:true}));
 assert.match(s,/role="img"/);assert.match(s,/aria-label="숏츠"/);assert.match(s,/--ss-icon-base:#ABCDEF/);assert.match(s,/data-motion="hover"/);assert.match(s,/data-active="true"/);assert.doesNotMatch(s,/aria-hidden/);
});
