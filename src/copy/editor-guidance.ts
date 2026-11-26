import type {QuickStage,QuickStatus} from '../core/quick-create';

export function redrawHint(s:{disabled:boolean;running:boolean;audio:boolean;current:boolean;matched:boolean;words:boolean}):string{
 if(s.running)return '';
 if(s.disabled)return '변경 사항을 저장하고 최신 작업 상태를 확인해 주세요.';
 if(!s.audio)return '음성을 먼저 추가해 주세요.';
 if(!s.current||!s.words)return '기존 음성에 자막을 맞춰 단어별 발화 시간 정보를 준비해 주세요.';
 if(!s.matched)return '음성과 자막 분석에서 확인이 필요한 항목을 해결해 주세요.';
 return '';
}
const running:Record<QuickStage,string>={script:'대본을 확인하고 있어요',voice:'기존 음성을 확인하고 있어요',storyboard:'공정마다 새로운 장면을 구성하고 있어요',render:'새 그래픽으로 영상을 만들고 있어요',verify:'영상 파일을 검사하고 있어요',done:'영상 결과를 확인하고 있어요'};
export function redrawStatusLabel(s:Pick<QuickStatus,'status'|'stage'|'progress'>):string{
 if(s.status==='done')return '새 그래픽 초안이 준비됐어요';
 if(s.status==='error')return '그래픽을 다시 만들지 못했어요';
 if(s.progress===0)return '장면 교체를 준비하고 있어요';
 return running[s.stage];
}
// Translate only at display time. Keep persisted evidence and machine diagnostics intact.
export function timingIssueLabel(issue:string):string{
 const exact:Record<string,string>={'원본 대본 없음':'원본 대본을 먼저 입력해 주세요.','음성 파일 없음':'음성 파일을 먼저 추가해 주세요.'};
 if(Object.prototype.hasOwnProperty.call(exact,issue))return exact[issue];
 const prefixes:[string,string][]=[
  ['낮은 어절 인식 신뢰도: ','인식이 불확실한 단어: '],
  ['자막과 어절 근거 불일치: ','자막과 단어별 발화 내용이 달라요: '],
  ['어절 타임스탬프 누락: ','단어별 발화 시간 정보가 없어요: '],
  ['원본 대본 누락 가능: ','대본의 일부가 빠졌을 수 있어요: '],
  ['원문 일치 불확실: ','대본과 일치하는지 확인해 주세요: '],
  ['원본 대본 끝부분 미정렬: ','대본 끝부분의 발화 시간을 확인해 주세요: '],
 ];
 for(const [from,to] of prefixes)if(issue.startsWith(from))return to+issue.slice(from.length);
 return issue;
}
