import type {IconPalette,IconColors} from '../types';
function palette(id:string,label:string,shorts:string,card:string,threads:string,trend:string,campaign:string):IconPalette {
 return {id,label,colors:{shorts,'card-news':card,threads,trend,campaign}};
}
export const palettes=[
 palette('soft-vibrant','Soft Vibrant','#E34D63','#8061D9','#168E86','#E89A35','#4285D9'),
 palette('pastel','Pastel','#E88FA2','#9C8BDE','#67B6AD','#E7B578','#8DAAE7'),
 palette('apple-inspired','Apple Inspired','#F05245','#3478F6','#28A36A','#E9A127','#7956CB'),
 palette('sunset','Sunset','#EE6548','#D65391','#D99A38','#B86B39','#A45E9C'),
 palette('modern-premium','Modern Premium','#475569','#7866A7','#377C83','#AD8749','#5E779B'),
 palette('digital-pop','Digital Pop','#F22D76','#7047EB','#008CB9','#E49B20','#2CA56C'),
 palette('cobalt','Cobalt','#1E60F3','#1E60F3','#1E60F3','#1E60F3','#1E60F3'),
 palette('monochrome','Monochrome','#20242C','#525966','#828996','#626B78','#3D4450'),
] as const;
export const defaultPalette=palettes[0];
export function getPalette(id:string):IconPalette{return palettes.find(p=>p.id===id)??defaultPalette;}
export function getColors(id:string):IconColors{return {...getPalette(id).colors};}
