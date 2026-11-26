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
export function deriveColors(hex:string){
 const base=normalizeHex(hex)??'#E34D63';
 const ink=contrast(base,'#FFFFFF')>=contrast(base,'#000000')?'#FFFFFF':'#000000';
 return {base,light:mixColor(base,'#FFFFFF',.55),mid:mixColor(base,'#FFFFFF',.30),deep:mixColor(base,'#000000',.22),ink};
}
