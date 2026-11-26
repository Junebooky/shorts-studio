import {z} from 'zod';
export const ProcessOperation=z.enum(['wafer','oxidation','lithography','etch','deposition','interconnect','eds','packaging']);
export type ProcessOperation=z.infer<typeof ProcessOperation>;
const pos=z.object({x:z.number().int().min(90).max(710),y:z.number().int().min(80).max(370)}).strict();
export const MechanismSchema=z.object({type:z.literal('mechanism'),action:z.enum(['move','assemble','separate','transform','flow','scan']),objects:z.array(z.object({shape:z.enum(['disc','block','chip','particle','document','person','gear','container']),label:z.string().trim().min(1).max(10),from:pos,to:pos,role:z.enum(['subject','material','result'])}).strict()).min(2).max(5)}).strict();
export const SemiconductorSchema=z.object({type:z.literal('semiconductor'),operation:ProcessOperation}).strict();
export type Mechanism=z.infer<typeof MechanismSchema>;
export const semanticGuide='For concrete events use visual {type:"mechanism",action:"move|assemble|separate|transform|flow|scan",objects:[{shape:"disc|block|chip|particle|document|person|gear|container",label:"short spoken concept <=10 chars",from:{x:90..710,y:80..370},to:{x:90..710,y:80..370},role:"subject|material|result"}]} (2–5 objects). Choose different meaningful object configurations and physical actions; no merely decorative movement. Each mechanism needs cues:[{slot:0,wordIndex:integer,expectedWord:exact wordEvidence.text}] on a spoken action word within that beat. Coordinates are in an 800x480 illustration, labels below objects. No invented times. Prefer 1–2 concise objects in focus and keep labels apart. For videos >=12s with >=3 beats, at least half of beats must use meaningful mechanisms unless style is kinetic; never repeat the same layout for three consecutive beats. Do not use a diagram only as a title card.';
export function motionSignature(v:{type:string;[key:string]:unknown}){
 if(v.type==='mechanism'){const m=MechanismSchema.parse(v);return JSON.stringify([m.type,m.action,m.objects.map(o=>[o.shape,o.role,o.from,o.to])]);}
 if(v.type==='semiconductor')return 'semiconductor:'+v.operation;
 return v.type;
}
export function assertMotionVariety(scenes:{visual?:any;cues?:unknown[];startMs:number;endMs:number}[],durationMs:number,styleId?:string){
 if(durationMs<12000||scenes.length<3)return;
 let previous='',run=0,concrete=0;
 for(const scene of scenes){const v=scene.visual;if(!v)throw new Error('구체적인 장면 그래픽이 필요합니다.');const signature=motionSignature(v);run=signature===previous?run+1:1;previous=signature;
 if(run>=3)throw new Error('동일한 그래픽 구성이 세 장면 연속 반복됩니다. 다른 시각적 동작으로 다시 설계하세요.');
 if(v.type==='mechanism'||v.type==='semiconductor'){concrete++;if(!scene.cues?.length)throw new Error('대사의 실제 어절에 맞춘 동작 시작 근거가 필요합니다.');}
 }
 if(styleId!=='kinetic'&&concrete<Math.ceil(scenes.length/2))throw new Error('설명 영상에는 실제 대상과 동작을 표현하는 장면이 더 필요합니다.');
}
