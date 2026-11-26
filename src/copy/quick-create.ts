import type {QuickStage,QuickStatus} from '../core/quick-create';
export const quickStageLabels:Record<QuickStage,string>={
 script:'대본을 쓰고 있어요',
 voice:'음성을 만들고 발화 시간을 확인하고 있어요',
 storyboard:'영상의 장면을 구성하고 있어요',
 render:'영상을 만들고 있어요',
 verify:'영상 파일을 검사하고 있어요',
 done:'초안 영상이 준비됐어요',
};
export function quickStatusLabel(status:Pick<QuickStatus,'status'|'stage'>):string{
 if(status.status==='done')return '초안 영상이 준비됐어요';
 if(status.status==='error')return ({script:'대본 작성 중 문제가 생겼어요.',voice:'음성 준비 중 문제가 생겼어요.',storyboard:'장면 구성 중 문제가 생겼어요.',render:'영상 생성 중 문제가 생겼어요.',verify:'영상 파일 검사 중 문제가 생겼어요.',done:'영상 결과를 확인하지 못했어요.'})[status.stage];
 return status.stage==='done'?'영상 결과를 확인하고 있어요':quickStageLabels[status.stage];
}
export function quickStartHint(s:{disabled:boolean;configured:boolean;available:boolean;subject:boolean;voice:boolean;consent:boolean;configError:boolean}):string{
 if(s.disabled)return '진행 중인 작업이 끝나면 계속할 수 있어요.';
 if(!s.configured)return s.configError?'연결 설정을 확인하지 못했어요. 오류 안내를 확인해 주세요.':'제작 연결 설정을 확인하고 있어요.';
 if(!s.available)return '위의 AI 연결 설정을 먼저 완료해 주세요.';
 if(!s.subject)return '어떤 영상을 만들지 주제를 입력해 주세요.';
 if(!s.voice)return '목소리를 선택하거나 목소리 ID를 입력해 주세요.';
 if(!s.consent)return 'AI 서비스에 전달되는 정보와 비용 안내를 확인해 주세요.';
 return '';
}
