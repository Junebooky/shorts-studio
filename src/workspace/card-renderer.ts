import {drawCardGraphic} from './card-graphic';
import {readableInk} from './brand-kit';
import {cardSizes,wrapCardText,type CardDeck,type CardPage} from './card-news';

const families={sans:'"Noto Sans KR", sans-serif',serif:'"Noto Serif KR", Georgia, serif',mono:'ui-monospace, monospace'};
export type CardRenderResult={overflow:boolean};
function fitText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,height:number,fontSize:number,weight:number,family:string,color:string){
 if(!text)return false;
 const lineHeight=Math.ceil(fontSize*1.4);ctx.font=weight+' '+fontSize+'px '+family;ctx.fillStyle=color;ctx.textBaseline='top';
 const lines=wrapCardText(text,width,line=>ctx.measureText(line).width),maxLines=Math.floor(height/lineHeight);
 lines.slice(0,maxLines).forEach((line,i)=>ctx.fillText(line,x,y+i*lineHeight));
 return lines.length>maxLines||lines.some(line=>ctx.measureText(line).width>width);
}
export async function renderCard(canvas:HTMLCanvasElement,deck:CardDeck,page:CardPage,index:number):Promise<CardRenderResult>{
 const {width:w,height:h}=cardSizes[deck.size],b=deck.brand,family=families[b.font];
 if(document.fonts){const sample=(b.name||deck.name)+page.title+page.body+JSON.stringify(page.visual??'')+' 실리콘 웨이퍼 산소 산화막 마스크 감광막 선택적 제거 남은 회로 패턴 박막 형성 이온 주입 전기적 특성 조절 금속 연결선 소자 사이 전기 경로 전기 검사 양품 불량 선별 다이 기판 보호체 완성 패키지 ✓× 0123456789';await document.fonts.load('400 40px '+family,sample);await document.fonts.load('700 64px '+family,sample);await document.fonts.ready;}
 const logo=b.logo?new Image():null;if(logo){logo.src=b.logo!;await logo.decode();}
 canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');if(!c)throw Error('이미지 미리보기를 만들지 못했어요.');
 c.fillStyle=b.background;c.fillRect(0,0,w,h);
 const pad=88,inner=w-2*pad;
 if(logo){const scale=Math.min(80/logo.naturalWidth,80/logo.naturalHeight);c.drawImage(logo,pad,65,logo.naturalWidth*scale,logo.naturalHeight*scale);}
 else{c.fillStyle=b.primary;c.fillRect(pad,65,64,64);fitText(c,Array.from(b.name||'B')[0],pad+14,78,40,50,34,700,family,readableInk(b.primary));}
 const headerOverflow=fitText(c,b.name||deck.name,pad+100,78,inner-100,72,26,700,family,b.foreground);
 c.fillStyle=b.primary;c.fillRect(pad,178,inner,8);
 if(page.layout==='cover'){
  const cy=h-330;c.fillStyle=b.primary;c.beginPath();c.arc(w-252,cy,122,0,Math.PI*2);c.fill();c.fillStyle=b.accent;c.globalAlpha=.85;c.beginPath();c.arc(w-142,cy+72,80,0,Math.PI*2);c.fill();c.globalAlpha=1;
 }else if(page.layout==='closing'){c.fillStyle=b.accent;c.fillRect(pad,h-240,inner,10);}
 if(page.visual){
  const titleH=170,titleY=212,graphicY=titleY+titleH+12,graphicH=h===1080?330:440,bodyY=graphicY+graphicH+12,bodyH=h-142-bodyY;
  const fit=(text:string,y:number,height:number,start:number,min:number,weight:number)=>{let size=start;while(size>min){c.font=weight+' '+size+'px '+family;if(wrapCardText(text,inner,l=>c.measureText(l).width).length*Math.ceil(size*1.4)<=height)break;size-=2;}return fitText(c,text,pad,y,inner,height,size,weight,family,b.foreground);};
  const titleOverflow=fit(page.title,titleY,titleH,64,32,700);const graphicOverflow=await drawCardGraphic(c,page,deck,pad,graphicY,inner,graphicH,family);const bodyOverflow=fit(page.body,bodyY,bodyH,40,26,400);
  c.fillStyle=b.primary;c.fillRect(pad,h-112,140,48);fitText(c,String(index+1).padStart(2,'0')+' / '+String(deck.pages.length).padStart(2,'0'),pad+14,h-103,125,40,24,700,family,readableInk(b.primary));
  return {overflow:headerOverflow||titleOverflow||graphicOverflow||bodyOverflow};
 }
 const titleSize=b.style==='bold'?76:b.style==='editorial'?61:66;
 const titleY=240,titleH=page.layout==='cover'?(h===1080?210:350):270;
 const titleOverflow=fitText(c,page.title,pad,titleY,inner,titleH,titleSize,700,family,b.foreground);
 const bodyY=titleY+titleH+28,bodyEnd=page.layout==='cover'?h-490:page.layout==='closing'?h-270:h-170;
 const bodyOverflow=fitText(c,page.body,pad,bodyY,inner,Math.max(0,bodyEnd-bodyY),page.layout==='cover'?36:42,400,family,b.foreground);
 c.fillStyle=b.primary;c.fillRect(pad,h-112,140,48);fitText(c,String(index+1).padStart(2,'0')+' / '+String(deck.pages.length).padStart(2,'0'),pad+14,h-103,125,40,24,700,family,readableInk(b.primary));
 return {overflow:headerOverflow||titleOverflow||bodyOverflow};
}
