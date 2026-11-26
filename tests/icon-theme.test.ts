import {test} from 'node:test';
import assert from 'node:assert/strict';
import {palettes,getColors} from '../src/design-system/icons/theme/palettes';
import {deriveColors,contrast,normalizeHex,reelsGradient} from '../src/design-system/icons/theme/color-utils';
import {defaultTheme,parseTheme,ICON_THEME_KEY} from '../src/design-system/icons/theme/storage';
import {iconNames} from '../src/design-system/icons/types';
test('all eight palettes have valid colors and readable foreground',()=>{
 assert.equal(palettes.length,8);
 for(const p of palettes)for(const name of iconNames){
  assert.ok(normalizeHex(p.colors[name]));
  const c=deriveColors(p.colors[name]);assert.equal(c.ink,'#FFFFFF');assert.ok(contrast(c.surface,c.ink)>=3);
 }
});
test('palette colors are copied rather than mutated',()=>{const colors=getColors('soft-vibrant');colors.shorts='#000000';assert.equal(getColors('soft-vibrant').shorts,'#F42972');});
test('theme storage validates version and each override',()=>{
 assert.deepEqual(parseTheme('invalid'),defaultTheme());
 assert.deepEqual(parseTheme('{"version":2}'),defaultTheme());
 const t=parseTheme(JSON.stringify({version:1,paletteId:'sunset',colors:{shorts:'#abcdef','card-news':'bad'},motionEnabled:false}));
 assert.equal(t.colors.shorts,'#ABCDEF');assert.equal(t.colors['card-news'],'#D65391');assert.equal(t.motionEnabled,false);
 assert.deepEqual(parseTheme(JSON.stringify(t)),t);
 assert.equal(ICON_THEME_KEY,'shorts-studio.icon-theme.v1');
});

test('existing v1 three-color preferences acquire new role defaults without losing overrides',()=>{
 const t=parseTheme(JSON.stringify({version:1,paletteId:'sunset',colors:{shorts:'#ABCDEF','card-news':'#123456',threads:'#654321'},motionEnabled:false}));
 assert.equal(t.colors.shorts,'#ABCDEF');assert.equal(t.colors.trend,'#B86B39');assert.equal(t.colors.campaign,'#A45E9C');assert.equal(t.motionEnabled,false);
});

test('v1 five-role saved preferences preserve custom colors and gain navigation defaults',()=>{
 const t=parseTheme(JSON.stringify({version:1,paletteId:'soft-vibrant',colors:{shorts:'#123456',trend:'#654321'},motionEnabled:true}));
 assert.equal(t.colors.shorts,'#123456');assert.equal(t.colors.trend,'#654321');assert.equal(t.colors.home,'#6674E8');assert.equal(t.colors.library,'#8491A5');assert.equal(iconNames.length,10);
});

test('reels default preserves supplied gradient; other colors are derived',()=>{
 assert.deepEqual(reelsGradient('#F42972'),{start:'#FFAC39',middle:'#F42972',end:'#8245F5'});
 const custom=reelsGradient('#123456');assert.equal(custom.middle,'#123456');assert.notEqual(custom.start,custom.end);
 const white=deriveColors('#FFFFFF');assert.equal(white.base,'#FFFFFF');assert.equal(white.ink,'#FFFFFF');assert.ok(contrast(white.surface,white.ink)>=3);
});

test('quick play defaults to supplied coral and preserves legacy settings',()=>{
 const t=parseTheme(JSON.stringify({version:1,paletteId:'soft-vibrant',colors:{shorts:'#123456'},motionEnabled:true}));
 assert.equal(t.colors['quick-play'],'#FF553C');assert.equal(t.colors.shorts,'#123456');
});
