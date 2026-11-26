import {opaqueRgb,type TextAppearance} from '../../src/core/quality/readability';
// Measure authored CSS, not screenshot pixels. Only a text element's own opaque solid
// background is considered; transparent/gradient/media-backed text is unverified.
export function inspectTextAppearance(el:HTMLElement,root:HTMLElement):TextAppearance{
 const style=getComputedStyle(el);const foreground=opaqueRgb(style.color);
 const font=Number.parseFloat(style.fontSize);let fontPx=Number.isFinite(font)&&font>0?font:null;
 const base:TextAppearance={fontPx,foreground,background:null,reason:'unknown'};
 if(el.children.length){return {...base,fontPx:null,reason:'mixed'};}
 for(let node:HTMLElement|null=el;node;node=node.parentElement){
  const s=getComputedStyle(node);
  if(s.transform!=='none'||s.scale!=='none'&&s.scale!=='1'||s.zoom!=='1'&&s.zoom!=='normal')fontPx=null;
  if(Number(s.opacity)!==1||s.filter!=='none'||s.mixBlendMode!=='normal'||s.backdropFilter!=='none')return {...base,fontPx,reason:'complex'};
  if(node===root)break;
 }
 if(style.backgroundImage!=='none'||style.textShadow!=='none')return {...base,fontPx,reason:'complex'};
 const background=opaqueRgb(style.backgroundColor);
 if(!background||!foreground)return {...base,fontPx,reason:'transparent'};
 return {...base,fontPx,background,reason:'solid'};
}
