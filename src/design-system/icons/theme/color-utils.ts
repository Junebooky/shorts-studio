export function normalizeHex(value:unknown):string|null {
 return typeof value==='string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : null;
}
function rgb(hex:string):number[] {
 const c=normalizeHex(hex);
 if(!c)throw new Error('Invalid icon color');
 return [1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
}
export function mixColor(hex:string,target:string,ratio:number):string {
 const a=rgb(hex),b=rgb(target),t=Math.max(0,Math.min(1,ratio));
 return '#'+a.map((n,i)=>Math.round(n+(b[i]-n)*t).toString(16).padStart(2,'0')).join('').toUpperCase();
}
function luminance(hex:string):number {
 const [r,g,b]=rgb(hex).map(n=>{const x=n/255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4;});
 return .2126*r+.7152*g+.0722*b;
}
export function contrast(a:string,b:string):number {
 const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
// Decorative white graphics need a distinguishable colored backing. Preserve the
// exact selected base token; only the painted surface is darkened if necessary.
export function whiteSurface(hex:string):string {
 if(contrast(hex,'#FFFFFF')>=3)return hex;
 for(let i=1;i<=100;i++){
  const candidate=mixColor(hex,'#000000',i/100);
  if(contrast(candidate,'#FFFFFF')>=3)return candidate;
 }
 return '#000000';
}
export const originalReelsColor='#F42972';
export function deriveColors(hex:string){
 const base=normalizeHex(hex)??originalReelsColor;
 const surface=whiteSurface(base);
 return {base,surface,light:mixColor(base,'#FFFFFF',.55),mid:mixColor(base,'#FFFFFF',.30),deep:mixColor(surface,'#000000',.22),ink:'#FFFFFF'};
}
export function reelsGradient(hex:string){
 const {base,surface}=deriveColors(hex);
 // Exact uploaded gradient for the default swatch. Other swatches stay tonal.
 return base===originalReelsColor
  ? {start:'#FFAC39',middle:'#F42972',end:'#8245F5'}
  : {start:whiteSurface(mixColor(base,'#FFFFFF',.20)),middle:surface,end:mixColor(surface,'#000000',.25)};
}
