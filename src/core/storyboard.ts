import {z} from 'zod';
import {ThemeSchema,Scene,validate,frameAt,type Project,type SceneData} from './project';
import {DirectionSchema,VisualSchema} from './visual';
import {isCurrent} from './timing';
import {CueInputSchema,resolveCues} from './motion-cues';
export const StoryboardSchema=z.object({version:z.literal(1),projectId:z.string(),baseRevision:z.number().int().nonnegative(),acknowledgeTimingReview:z.boolean().default(false),direction:DirectionSchema,theme:ThemeSchema,beats:z.array(z.object({captionIds:z.array(z.string()).min(1).max(1000),purpose:z.string().trim().min(1).max(140),metaphor:z.string().trim().min(1).max(140),headline:z.string().trim().min(1).max(44),kicker:z.string().max(40),detail:z.string().max(55),visual:VisualSchema,cues:z.array(CueInputSchema).max(3).optional()}).strict()).min(1).max(300)}).strict();
export type Storyboard=z.input<typeof StoryboardSchema>;
export function draftStoryboard(p:Project){
 if(!p.audio||!p.captions.length||!isCurrent(p.analysis,p))throw new Error('원본 음성 및 최신 Master Timeline이 필요합니다.');
 return {version:1,projectId:p.id,baseRevision:p.revision,acknowledgeTimingReview:false,direction:{concept:'',audience:'',style:'',author:'agent'},theme:p.theme,beats:p.captions.map(c=>({captionIds:[c.id],purpose:'',metaphor:'',headline:'',kicker:'',detail:'',visual:null})),captionEvidence:p.captions.map(c=>({id:c.id,text:c.text,startMs:c.startMs,endMs:c.endMs})),wordEvidence:p.analysis?.words.map((w,index)=>({index,...w}))??[],timingIssues:p.analysis?.issues??[]};
}
export function compileStoryboard(p:Project,input:unknown):Project{
 const board=StoryboardSchema.parse(input);
 if(board.projectId!==p.id||board.baseRevision!==p.revision)throw new Error('다른 프로젝트 또는 오래된 리비전의 스토리보드입니다.');
 if(!p.audio||!p.captions.length||!isCurrent(p.analysis,p))throw new Error('원본 음성 및 최신 Master Timeline이 필요합니다.');
 if((p.analysis?.status==='review'||p.timingSource==='manual')&&!board.acknowledgeTimingReview)throw new Error('발화 불일치 또는 수동 수정 확인 필요. 실제 음성과 비교 후 승인하세요.');
 const ordered=board.beats.flatMap(b=>b.captionIds);
 if(ordered.length!==p.captions.length||ordered.some((id,i)=>id!==p.captions[i].id))throw new Error('자막 구간을 원래 순서대로 빠짐없이 한 번씩 포함하세요.');
 const byId=new Map(p.captions.map(c=>[c.id,c]));
 const scenes:SceneData[]=board.beats.map((b,i)=>{
  const startMs=i===0?0:byId.get(b.captionIds[0])!.startMs;
  const endMs=board.beats[i+1]?byId.get(board.beats[i+1].captionIds[0])!.startMs:p.durationMs;
  if(frameAt(endMs)<=frameAt(startMs))throw new Error('장면 길이 부족: '+(i+1));
  return Scene.parse({id:'scene-'+i,kind:i===0?'hook':i===board.beats.length-1?'closing':'orbit',startMs,endMs,headline:b.headline,kicker:b.kicker,detail:b.detail,visual:b.visual,cues:b.cues?resolveCues(b.cues,b.visual,p.analysis,startMs,endMs):undefined,intent:{purpose:b.purpose,metaphor:b.metaphor,captionIds:b.captionIds}});
 });
 const result={...p,theme:board.theme,direction:board.direction,scenes};
 const qa=validate(result);if(qa.errors.length)throw new Error(qa.errors.join('; '));return result;
}
