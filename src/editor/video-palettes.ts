import {contrastRatio} from '../engine/caption-palette';
import type {Project} from '../core/project';
type Theme=Project['theme'];
export const videoPalettes=[
 ['royal','로열 네이비','프리미엄','#102C57','#F8F0E5','#DAC0A3'],
 ['gold','블랙 골드','프리미엄','#171717','#F9F2DE','#D4AF37'],
 ['midnight','미드나이트','프리미엄','#10182B','#F8ECDD','#FFB971'],
 ['teal','사이버 틸','테크','#071E26','#E8FFFC','#2DD4BF'],
 ['electric','일렉트릭 블루','테크','#0F172A','#F8FAFC','#60A5FA'],
 ['violet','딥 바이올렛','테크','#25143D','#F5F0FF','#C4B5FD'],
 ['nordic','노르딕 화이트','미니멀','#F5F5F4','#18181B','#52525B'],
 ['editorial','퓨어 에디토리얼','미니멀','#F5F0E6','#24342F','#17665B'],
 ['stone','소프트 스톤','미니멀','#EBE8E2','#302C29','#695343'],
 ['forest','포레스트 그린','자연','#142D25','#F0F5E8','#A7D7A0'],
 ['matcha','말차 리넨','자연','#F5F1E7','#263B2A','#4C704E'],
 ['ocean','오션 캄','자연','#E8F4F5','#163A45','#126A78'],
 ['coral','코랄 팝','감성','#FFF1E8','#542B35','#B84040'],
 ['lavender','라벤더','감성','#F4EEFF','#342B52','#6951A3'],
 ['peach','피치 크림','감성','#FFF0DF','#392C50','#9E3B65'],
 ['lime','라임 에너지','볼드','#171717','#FFFFFF','#E5FC51'],
 ['red','레드 임팩트','볼드','#29151A','#FFF5F5','#FF8585'],
 ['amber','앰버 포커스','볼드','#25221B','#FFF8E6','#FBBF24'],
].map(([id,name,category,background,foreground,accent])=>({id,name,category,theme:{background,foreground,accent}}));
export const paletteReadable=(t:Theme)=>contrastRatio(t.background,t.foreground)>=4.5&&contrastRatio(t.background,t.accent)>=4.5;
export const samePalette=(a:Theme,b:Theme)=>(['background','foreground','accent'] as const).every(k=>a[k].toUpperCase()===b[k].toUpperCase());
