export const iconNames = ['shorts','card-news','threads','trend','campaign'] as const;
export type IconName = typeof iconNames[number];
export type IconMotion = 'none' | 'hover' | 'loop';
export type IconColors = Record<IconName,string>;
export type IconPalette = { id:string; label:string; colors:IconColors };
