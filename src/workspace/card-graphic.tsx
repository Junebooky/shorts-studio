import {renderToStaticMarkup} from 'react-dom/server';
import {EditorialGraphicState} from '../engine/EditorialGraphic';
import type {CardDeck,CardPage} from './card-news';
// Paint the same SVG geometry as the video engine, with Korean text drawn using
// the already loaded document canvas font (SVG image documents cannot use page webfonts).
export async function drawCardGraphic(ctx:CanvasRenderingContext2D,page:CardPage,deck:CardDeck,x:number,y:number,w:number,h:number,family:string):Promise<boolean>{
 if(!page.visual)return false;
 const theme={background:deck.brand.background,foreground:deck.brand.foreground,accent:deck.brand.primary};
 const markup=renderToStaticMarkup(<EditorialGraphicState visual={page.visual} theme={theme} layout={page.visualLayout}/>);
 const parsed=new DOMParser().parseFromString(markup.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"'),'image/svg+xml');
 const svg=parsed.documentElement as unknown as SVGSVGElement;
 const box=svg.getAttribute('viewBox')!.split(/\s+/).map(Number);
 // Extra horizontal room accommodates labels close to the original viewBox edge.
 const [vx,vy,vw,vh]=[box[0]-48,box[1]-12,box[2]+96,box[3]+24];
 const scale=Math.min(w/vw,h/vh),ox=x+(w-vw*scale)/2,oy=y+(h-vh*scale)/2;
 svg.setAttribute('viewBox',[vx,vy,vw,vh].join(' '));svg.setAttribute('width',String(vw));svg.setAttribute('height',String(vh));
 const labels=Array.from(svg.querySelectorAll('text')).map(el=>{
  let m=new DOMMatrix(),opacity=1;
  const chain:Element[]=[];for(let n:Element|null=el;n&&n!==svg;n=n.parentElement)chain.unshift(n);
  for(const n of chain){const t=(n as SVGGraphicsElement).transform?.baseVal?.consolidate()?.matrix;if(t)m=m.multiply(new DOMMatrix([t.a,t.b,t.c,t.d,t.e,t.f]));opacity*=Number(n.getAttribute('opacity')??1);}
  const item={text:el.textContent??'',x:Number(el.getAttribute('x')??0),y:Number(el.getAttribute('y')??0),size:Number(el.getAttribute('font-size')??32),fill:el.getAttribute('fill')??theme.foreground,m,opacity};el.remove();return item;
 });
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}));
 try{const image=new Image();image.src=url;await image.decode();ctx.drawImage(image,ox,oy,vw*scale,vh*scale);}finally{URL.revokeObjectURL(url);}
 let overflow=false;ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.translate(-vx,-vy);
 for(const l of labels){ctx.save();ctx.transform(l.m.a,l.m.b,l.m.c,l.m.d,l.m.e,l.m.f);ctx.globalAlpha=l.opacity;ctx.font='700 '+l.size+'px '+family;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle=l.fill;const metrics=ctx.measureText(l.text),half=metrics.width/2;const corners=[[l.x-half,l.y-(metrics.actualBoundingBoxAscent||l.size)],[l.x+half,l.y+(metrics.actualBoundingBoxDescent||0)]].map(([a,b])=>new DOMPoint(a,b).matrixTransform(l.m));if(corners.some(p=>p.x<vx||p.x>vx+vw||p.y<vy||p.y>vy+vh))overflow=true;ctx.fillText(l.text,l.x,l.y);ctx.restore();}
 ctx.restore();return overflow;
}
