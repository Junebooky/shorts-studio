import {z} from 'zod';import {ReadabilityEvidence} from './quality/readability';import {LayoutEvidence} from './quality/layout';
export const QualityCheck=z.object({id:z.string(),name:z.string(),status:z.enum(['pass','fail','not_checked']),detail:z.string(),required:z.boolean()});
export const QualityReport=z.object({version:z.literal(1),checks:z.array(QualityCheck).min(1),frames:z.array(z.number().int().nonnegative()),mode:z.enum(['preview','final']),layout:LayoutEvidence.optional(),readability:ReadabilityEvidence.optional(),integrity:z.object({bytes:z.number().int().positive(),sha256:z.string().regex(/^[0-9a-f]{64}$/),decodedFrames:z.number().int().nonnegative()}).optional()});
export type QualityReport=z.infer<typeof QualityReport>;
export const technicalPass=(q:QualityReport|undefined)=>!!q&&q.checks.some(c=>c.required)&&q.checks.filter(c=>c.required).every(c=>c.status==='pass');
export function inspectStreams(raw:unknown,expected:{width:number;height:number;fps:number;durationMs:number;audio:boolean}){
 const checks:z.infer<typeof QualityCheck>[]=[];
 const add=(id:string,name:string,ok:boolean,detail:string)=>checks.push({id,name,status:ok?'pass':'fail',detail,required:true});
 const p=z.object({streams:z.array(z.object({codec_type:z.string().optional(),codec_name:z.string().optional(),width:z.number().optional(),height:z.number().optional(),avg_frame_rate:z.string().optional()})),format:z.object({duration:z.coerce.number().finite().positive()})}).parse(raw);
 const v=p.streams.find(s=>s.codec_type==='video'),a=p.streams.find(s=>s.codec_type==='audio');
 const [n,d]=(v?.avg_frame_rate??'0/1').split('/').map(Number),fps=n/d;
 add('video','영상 코덱',v?.codec_name==='h264',v?.codec_name??'없음');
 add('size','영상 해상도',v?.width===expected.width&&v?.height===expected.height,(v?.width??0)+' × '+(v?.height??0));
 add('fps','프레임률',Number.isFinite(fps)&&Math.abs(fps-expected.fps)<.01,String(fps)+' FPS');
 add('duration','영상 길이',Math.abs(p.format.duration*1000-expected.durationMs)<=150,p.format.duration.toFixed(3)+'초 / 목표 '+(expected.durationMs/1000).toFixed(3)+'초 (허용 ±0.15초)');
 if(expected.audio)add('audio','오디오 스트림',a?.codec_name==='aac',a?.codec_name??'없음');
 else checks.push({id:'audio',name:'오디오 스트림',required:false,status:'not_checked',detail:'무음 프로젝트'});
 return checks;
}
