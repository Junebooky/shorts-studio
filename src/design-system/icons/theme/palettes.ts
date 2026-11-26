import {iconNames,type IconPalette,type IconColors} from '../types';
function palette(id:string,label:string,...values:[string,string,string,string,string,string,string,string,string]):IconPalette {
 return {id,label,colors:Object.fromEntries(iconNames.map((name,i)=>[name,values[i]])) as IconColors};
}
export const palettes=[
 palette('soft-vibrant','Soft Vibrant','#E34D63','#8061D9','#168E86','#E89A35','#4285D9','#6674E8','#4285D9','#35A36D','#8491A5'),
 palette('pastel','Pastel','#E88FA2','#9C8BDE','#67B6AD','#E7B578','#8DAAE7','#A4A3E8','#83ABD6','#83BC99','#A6B0C3'),
 palette('apple-inspired','Apple Inspired','#F05245','#3478F6','#28A36A','#E9A127','#7956CB','#5868E6','#3478F6','#28A36A','#727D90'),
 palette('sunset','Sunset','#EE6548','#D65391','#D99A38','#B86B39','#A45E9C','#A45E9C','#D77A64','#BA9556','#8B777C'),
 palette('modern-premium','Modern Premium','#475569','#7866A7','#377C83','#AD8749','#5E779B','#627399','#5E779B','#497B62','#758194'),
 palette('digital-pop','Digital Pop','#F22D76','#7047EB','#008CB9','#E49B20','#2CA56C','#7047EB','#008CB9','#2CA56C','#6874C5'),
 palette('cobalt','Cobalt','#1E60F3','#1E60F3','#1E60F3','#1E60F3','#1E60F3','#1E60F3','#1E60F3','#1E60F3','#1E60F3'),
 palette('monochrome','Monochrome','#20242C','#525966','#828996','#626B78','#3D4450','#3D4450','#626B78','#525966','#828996'),
] as const;
export const defaultPalette=palettes[0];
export function getPalette(id:string):IconPalette{return palettes.find(p=>p.id===id)??defaultPalette;}
export function getColors(id:string):IconColors{return {...getPalette(id).colors};}
