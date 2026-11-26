import {deriveColors,reelsGradient,mixColor,normalizeHex} from '../icons/theme/color-utils';
import type {IconColors} from '../icons/types';
import type {MotionFormat} from './types';
export function completionColors(colors:IconColors,format:MotionFormat,override?:string){
 const base=normalizeHex(override)??colors[format],c=deriveColors(base);
 const gradient=format==='shorts'?reelsGradient(base):{start:mixColor(c.surface,'#FFFFFF',.18),middle:c.surface,end:c.deep};
 return {...c,halo:mixColor(base,'#FFFFFF',.88),gradient};
}
export type CompletionColors=ReturnType<typeof completionColors>;
export const successColor='#168A55';
