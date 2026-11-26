export const motionNames=['shorts-complete','card-news-complete','threads-complete','all-content-complete'] as const;
export type MotionName=typeof motionNames[number];
export type MotionFormat='shorts'|'card-news'|'threads';
export type MotionPlay='once'|'loop'|'none';
export const motionFormats:readonly MotionFormat[]=['shorts','card-news','threads'];
export const motionLabels:Record<MotionName,string>={'shorts-complete':'숏츠 제작 완성!','card-news-complete':'카드뉴스 제작 완성!','threads-complete':'스레드 제작 완성!','all-content-complete':'모든 선택 콘텐츠 제작 완성!'};
export function normalizeFormats(input:readonly MotionFormat[]|undefined):MotionFormat[]{
 return motionFormats.filter(format=>(input??motionFormats).includes(format));
}
export function normalizeSpeed(value:number){return Number.isFinite(value)?Math.min(2,Math.max(.5,value)):1;}
export const motionDurations:Record<MotionName,number>={'shorts-complete':3000,'card-news-complete':3000,'threads-complete':3000,'all-content-complete':3500};
