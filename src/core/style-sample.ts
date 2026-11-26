import {demo,type Project} from './project';
import {effectiveTheme,type StyleId} from './styles';
export function styleSample(id:StyleId):Project{
const p:Project={...demo,id:'style-sample',title:'스타일 미리보기',styleId:id,durationMs:6000,script:'작은 선택이 변화를 만듭니다. 오늘부터 시작해 보세요.',audio:null,captions:[{id:'c1',startMs:0,endMs:3000,text:'작은 선택이 변화를 만듭니다.'},{id:'c2',startMs:3000,endMs:6000,text:'오늘부터 시작해 보세요.'}],scenes:[{id:'s1',kind:'hook',startMs:0,endMs:3000,headline:'작은 선택,\n큰 변화',kicker:'01 / THE IDEA',detail:'오늘의 행동이 내일의 방향을 만든다',visual:{type:'path',labels:['선택','행동','변화']}},{id:'s2',kind:'closing',startMs:3000,endMs:6000,headline:'지금부터\n한 걸음',kicker:'02 / TAKE ACTION',detail:'완벽보다 꾸준함',visual:{type:'focus',word:'시작'}}]};
return {...p,theme:effectiveTheme(p)};
}
