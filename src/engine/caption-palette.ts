/** Opaque caption surfaces guarantee contrast regardless of the scene behind them. */
export function luminance(hex:string):number{if(!/^#[0-9a-fA-F]{6}$/.test(hex))throw new Error('invalid color');const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];}
export function contrastRatio(a:string,b:string){const l=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (l[0]+.05)/(l[1]+.05);}
export function captionPalette(background:string){return luminance(background)>.4?{background:'#FFFFFF',color:'#0F172A',boxShadow:'0 8px 32px rgba(15,23,42,0.13)'}:{background:'#0F172A',color:'#FFFFFF',boxShadow:'0 8px 32px rgba(0,0,0,0.18)'};}
