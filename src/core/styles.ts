import {z} from 'zod';
export const StyleId=z.enum(['auto','editorial','kinetic','data','cinematic','minimal','illustrated']);
export type StyleId=z.infer<typeof StyleId>;
export type PresetId=Exclude<StyleId,'auto'>;
type Palette={background:string;foreground:string;accent:string};
type Profile={name:string;tag:string;description:string;guide:string;theme:Palette;layout:'editorial'|'kinetic'|'data'|'cinematic'|'minimal'|'illustrated';revealFrames:number;staggerFrames:number;headlineSize:number;strokeScale:number};
export const PRESETS:Record<PresetId,Profile>={
 editorial:{name:'에디토리얼',tag:'EDITORIAL',description:'종이 질감 · 절제된 정보 전달',guide:'신문과 잡지처럼 넓은 여백, 좌측 정렬, 정보 위계, 차분한 선형 전개. 과장된 장식 금지.',theme:{background:'#F5F0E6',foreground:'#24342F',accent:'#17665B'},layout:'editorial',revealFrames:18,staggerFrames:10,headlineSize:82,strokeScale:.8},
 kinetic:{name:'키네틱 타이포',tag:'KINETIC',description:'강한 글자 · 빠른 리듬',guide:'핵심 문구를 크게, 단어 단위 등장과 힘 있는 이동. 불필요한 보조 문구 최소화.',theme:{background:'#171717',foreground:'#FFFFFF',accent:'#E5FC51'},layout:'kinetic',revealFrames:8,staggerFrames:5,headlineSize:108,strokeScale:1.3},
 data:{name:'데이터 인포그래픽',tag:'DATA',description:'정돈된 구조 · 비교와 설명',guide:'격자, 명확한 라벨, 비교와 인과 관계. 차트는 대본에 있는 실제 수치만 사용하고 수치 없으면 개념 다이어그램으로 표현.',theme:{background:'#EDF5FF',foreground:'#102B49',accent:'#155CC4'},layout:'data',revealFrames:14,staggerFrames:9,headlineSize:76,strokeScale:1},
 cinematic:{name:'시네마틱',tag:'CINEMATIC',description:'깊이감 · 느린 카메라 이동',guide:'공간적 연결, 절제된 확대와 이동, 깊이감, 어두운 배경과 따뜻한 포인트. 급격한 전환 지양.',theme:{background:'#10182B',foreground:'#F8ECDD',accent:'#FFB971'},layout:'cinematic',revealFrames:26,staggerFrames:13,headlineSize:86,strokeScale:.85},
 minimal:{name:'미니멀',tag:'MINIMAL',description:'넓은 여백 · 한 가지 메시지',guide:'한 장면 한 메시지, 요소 수 최소화, 흰 공간, 섬세한 페이드. 장식적 요소 지양.',theme:{background:'#FFFFFF',foreground:'#252525',accent:'#6D45A2'},layout:'minimal',revealFrames:22,staggerFrames:10,headlineSize:76,strokeScale:.65},
 illustrated:{name:'벡터 일러스트',tag:'ILLUSTRATED',description:'부드러운 형태 · 친근한 설명',guide:'둥근 벡터 형태, 의미 있는 아이콘과 간결한 다이어그램, 부드러운 탄성 움직임. 색채로 관계 강조.',theme:{background:'#FFF0DF',foreground:'#392C50',accent:'#9E3B65'},layout:'illustrated',revealFrames:15,staggerFrames:8,headlineSize:82,strokeScale:1.35}
};
export const PRESET_IDS=Object.keys(PRESETS) as PresetId[];
export function preset(id:StyleId|undefined){return id&&id!=='auto'?PRESETS[id]:undefined;}
export function effectiveTheme(p:{styleId?:StyleId;theme:Palette}):Palette{return {...(preset(p.styleId)?.theme??p.theme)};}
export function styleName(id?:StyleId){return preset(id)?.name??'AI 자동 선택';}
export function styleInstruction(id?:StyleId){const p=styleContract(id);return p?'사용자 고정 스타일: '+p.name+' ('+p.id+'). '+p.guide+' 고정 팔레트 '+JSON.stringify(p.palette)+'; 렌더러 기본값: 레이아웃 '+p.layout+', 헤드라인 기본 '+p.headlineSize+'px (긴 문구 축소), 등장 '+p.revealFrames+'프레임, 그래픽 간격 '+p.staggerFrames+'프레임, 선 두께 배율 '+p.strokeScale+'. '+p.contentRule+' 다른 스타일로 바꾸지 않는다.':'AI 자동 선택: 대본의 목적과 시청자에 맞는 스타일 및 팔레트를 설계한다. 실제 수치/자료만 사용하고 원본 발화 시간을 유지한다.';}

// These values describe the existing renderer profile; contentRule is a semantic planning guide, not a new render effect.
const CONTENT_RULES:Record<PresetId,string>={
 editorial:'핵심 주장과 근거를 구분하고 읽는 순서를 명확히 한다.',
 kinetic:'핵심 어절을 먼저 고르고 실제 발화에 맞춰 강조한다. 문장을 무리하게 축소하지 않는다.',
 data:'수치가 없으면 비교·관계·흐름을 개념 도식으로 표현한다. 허위 수치 금지.',
 cinematic:'서사와 공간 관계가 의미를 전달해야 한다. 단순 장식용 카메라 동작을 추가하지 않는다.',
 minimal:'한 장면에 한 가지 핵심 메시지를 두고 중복 장식과 문구를 줄인다.',
 illustrated:'도식과 아이콘은 대본의 구체적 개념을 설명해야 한다. 참고용 파일은 제작용 소재로 간주하지 않는다.'
};
export function styleContract(id?:StyleId){
 if(!id||id==='auto')return undefined;
 const p=PRESETS[id];
 return {id,name:p.name,tag:p.tag,guide:p.guide,palette:{...p.theme},layout:p.layout,revealFrames:p.revealFrames,staggerFrames:p.staggerFrames,headlineSize:p.headlineSize,strokeScale:p.strokeScale,contentRule:CONTENT_RULES[id]};
}
