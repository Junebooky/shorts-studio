import type {QualityReport} from './quality';
import {validate,type Project} from './project';
import {isCurrent} from './timing';
import {briefCurrent} from './creative-brief';
export function productionReadiness(p:Project){
 const script=!!p.script.trim()&&p.id!=='demo';
 const voice=script&&!!p.audio;
 const timing=voice&&isCurrent(p.analysis,p)&&p.captions.length>0&&p.timingSource!=='unverified'&&p.timingSource!=='demo';
 const errors=validate(p).errors;
 const board=timing&&briefCurrent(p)&&!!p.direction&&p.scenes.length>0&&p.scenes.every(s=>!!s.intent&&!!s.visual)&&p.scenes.flatMap(s=>s.intent?.captionIds??[]).join('|')===p.captions.map(c=>c.id).join('|')&&!errors.length;
 return {script,voice,timing,board,errors};
}
export type ProductionState={revision:number;readiness:ReturnType<typeof productionReadiness>;voiceApproved:boolean;requestPrepared:boolean;reviewReady:boolean;reviewApproved:boolean;finalReady:boolean;quality?:QualityReport;reviewRunId?:string};
