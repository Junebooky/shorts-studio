import {z} from 'zod';
// A small declarative drawing language, not arbitrary SVG/XML, CSS or executable code.
const ink=z.enum(['foreground','accent','background','muted','none']);
const slot=z.number().int().min(0).max(2);
const n=z.number().int().min(-800).max(800);
const motion=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('translate'),slot,dx:n,dy:n}).strict(),
 z.object({kind:z.literal('rotate'),slot,degrees:z.number().int().min(-720).max(720),cx:z.number().int().min(16).max(784),cy:z.number().int().min(16).max(464)}).strict(),
 z.object({kind:z.literal('draw'),slot}).strict(),
 z.object({kind:z.literal('reveal'),slot}).strict()
]);
type Point=[number,number];
const arity:Record<string,number>={M:2,L:2,Q:4,C:6,Z:0};
export function pathPoints(d:string):Point[]{
 const tokens=d.trim().split(/\s+/),points:Point[]=[];let open=false,segments=0;
 if(tokens.length>160||tokens[0]!=='M')throw Error('경로는 M으로 시작하고 160개 토큰 이하여야 해요.');
 for(let i=0;i<tokens.length;){const cmd=tokens[i++],k=arity[cmd];if(k===undefined||!Object.hasOwn(arity,cmd)||i+k>tokens.length||(!open&&cmd!=='M'))throw Error('M L Q C Z 절대 경로만 사용할 수 있어요.');
  if(cmd==='M')open=true;else if(cmd==='Z'){open=false;}else segments++;
  for(let j=0;j<k;j+=2){const a=tokens[i++],b=tokens[i++];if(!/^\d{1,3}$/.test(a)||!/^\d{1,3}$/.test(b))throw Error('경로 좌표는 공백으로 분리한 정수만 가능해요.');const x=Number(a),y=Number(b);if(x<16||x>784||y<16||y>464)throw Error('그래픽 안전 영역을 벗어났어요.');points.push([x,y]);}
 }
 if(segments<1||new Set(points.map(p=>p.join(','))).size<2)throw Error('실제로 그려지는 경로가 필요해요.');
 return points;
}
const pathSchema=z.object({d:z.string().min(7).max(1000),fill:ink,stroke:ink,width:z.number().min(1).max(10),opacity:z.number().min(.15).max(1).optional()}).strict().superRefine((p,ctx)=>{try{pathPoints(p.d);if(p.fill==='none'&&p.stroke==='none')throw Error('보이는 경로가 필요해요.');}catch(e){ctx.addIssue({code:'custom',message:e instanceof Error?e.message:'경로 오류'});}});
const layer=z.object({id:z.string().regex(/^[a-z][a-z0-9-]{0,23}$/),paths:z.array(pathSchema).min(1).max(6),motion:motion.optional()}).strict();
const label=z.object({text:z.string().trim().min(1).max(10),x:z.number().int().min(120).max(680),y:z.number().int().min(40).max(448)}).strict();
export const VectorSchema=z.object({type:z.literal('vector'),subject:z.string().trim().min(1).max(60),layers:z.array(layer).min(2).max(8),labels:z.array(label).max(4)}).strict();
export type VectorVisual=z.infer<typeof VectorSchema>;
export function vectorSlots(v:VectorVisual){return [...new Set(v.layers.flatMap(l=>l.motion?[l.motion.slot]:[]))].sort((a,b)=>a-b);}
export function vectorErrors(v:VectorVisual):string[]{
 const errors:string[]=[],slots=vectorSlots(v),count=v.layers.reduce((s,l)=>s+l.paths.length,0);
 if(count<3||count>24)errors.push('장면에는 3~24개의 실제 경로가 필요해요.');
 if(new Set(v.layers.map(l=>l.id)).size!==v.layers.length)errors.push('레이어 ID가 중복됐어요.');
 if(!slots.length||slots.some((s,i)=>s!==i))errors.push('동작 슬롯은 0부터 연속적으로 사용해야 해요.');
 if(!v.layers.some(l=>!l.motion))errors.push('움직임의 기준이 되는 정적 구조가 필요해요.');
 if(!v.layers.some(l=>l.motion&&l.motion.kind!=='reveal'))errors.push('등장 효과 외에 실제 변화나 이동이 필요해요.');
 for(const l of v.layers){const m=l.motion;if(!m)continue;
  if(m.kind==='draw'&&l.paths.some(p=>p.fill!=='none'||p.stroke==='none'))errors.push('그리기 동작은 선 전용 경로에 사용해요.');
  if(m.kind==='translate'&&m.dx===0&&m.dy===0)errors.push('이동량이 0이에요.');
  if(m.kind==='rotate'&&m.degrees===0)errors.push('회전량이 0이에요.');
  for(const p of l.paths){let pts:Point[];try{pts=pathPoints(p.d);}catch{continue;}
   if(m.kind==='translate'&&pts.some(([x,y])=>x+m.dx<16||x+m.dx>784||y+m.dy<16||y+m.dy>464))errors.push('이동 경로가 안전 영역을 벗어나요.');
   if(m.kind==='rotate'){const radius=Math.max(...pts.map(([x,y])=>Math.hypot(x-m.cx,y-m.cy)));if(m.cx-radius<16||m.cx+radius>784||m.cy-radius<16||m.cy+radius>464)errors.push('회전 범위가 안전 영역을 벗어나요.');}
  }
 }
 for(let i=0;i<v.labels.length;i++)for(let j=0;j<i;j++){const a=v.labels[i],b=v.labels[j];if(Math.abs(a.y-b.y)<34&&Math.abs(a.x-b.x)<(a.text.length+b.text.length)*13+12)errors.push('그래픽 설명 글자가 서로 겹쳐요.');}
 return [...new Set(errors)];
}
export function assertVectorCues(v:VectorVisual,cues:readonly {slot:number}[]){const errors=vectorErrors(v);const actual=cues.map(c=>c.slot);if(JSON.stringify(actual)!==JSON.stringify(vectorSlots(v)))errors.push('모든 벡터 동작 슬롯에 실제 발화 근거를 연결해 주세요.');if(errors.length)throw Error(errors.join('; '));}
export function vectorSignature(v:VectorVisual){return JSON.stringify(v.layers.map(l=>[l.paths.map(p=>p.d.trim().split(/\s+/).join(' ')),l.motion??null]));}
export const vectorGuide='Prefer a bespoke vector cutaway or concrete object diagram for physical/scientific/technical narration instead of generic labeled circles/blocks. Use visual {type:"vector",subject:"actual depicted object",layers:[{id:"base",paths:[{d:"M 120 100 L 250 100 L 250 240 L 120 240 Z",fill:"muted",stroke:"foreground",width:3}],motion OPTIONAL}],labels:[{text:"short Korean label",x:200,y:400}]}. Draw actual silhouettes and internal parts with distinct absolute M x y, L x y, Q x1 y1 x y, C x1 y1 x2 y2 x y, Z commands; explicit command for each segment, spaces only, integer x 16..784 y 16..464, viewBox 800x480. 2..8 layers, 3..24 paths overall, 1..6 per layer, id lowercase unique, fill/stroke foreground|accent|background|muted|none, width 1..10, optional opacity .15..1. No raw SVG, CSS, urls, scripts, glyph names or image URLs. Labels <=10 chars, at most 4, x120..680 y40..448, separate labels. Layers back-to-front. At least one stationary structural layer and one actual change. motion {kind:"translate",slot:0,dx:-80,dy:0} starts at offset and ends at drawn geometry; {kind:"rotate",slot:0,cx:400,cy:240,degrees:180} ends at original geometry; {kind:"draw",slot:0} only for unfilled stroked paths; {kind:"reveal",slot:0} only as supporting effect. All geometry and movement inside safe bounds, rotation full bounding circle inside. Slots 0..2 contiguous, exactly one cue per used slot on the spoken action using exact wordEvidence.index/text. Design a useful final still for card reuse. Make geometry distinguish actual objects and mechanisms; not decorative complexity. Keep vectors compact, not repeated identical geometry. Legacy path/contrast/cycle/focus/typography only when concept genuinely fits; mechanism is a fallback for simple objects. Never invent details not supported by narration.';
