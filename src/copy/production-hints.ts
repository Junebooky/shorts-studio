// Display-only explanations. The actual production gates remain in ProductionPanel.
export type GuidanceInput={
 busy:boolean;dirty:boolean;rendering:boolean;current:boolean;statusError:boolean;active:boolean;
 script:boolean;voice:boolean;timing:boolean;board:boolean;voiceApproved:boolean;
 reviewReady:boolean;technicalPassed:boolean;reviewApproved:boolean;finalReady:boolean;
 voiceNotes:boolean;visualNotes:boolean;feedback:boolean;
};
export function productionHints(s:GuidanceInput){
 const common=s.dirty?'변경 사항을 먼저 저장해 주세요.':s.rendering?'영상을 만들고 있어요. 작업이 끝나면 계속할 수 있어요.':s.busy?'진행 중인 작업이 끝나면 계속할 수 있어요.':!s.current?(s.statusError?'제작 상태를 확인하지 못했어요. 오류 안내를 확인해 주세요.':'최신 제작 상태를 확인하고 있어요.'):'';
 const voice=!s.script?'대본을 먼저 입력해 주세요.':!s.voice?'AI 성우로 음성을 만들거나 음성 파일을 추가해 주세요.':'';
 const active='진행 중인 AI 제작 작업을 완료하거나 취소해 주세요.';
 const approval=!s.voiceApproved?'음성을 들어보고 확인 내용을 저장해 주세요.':'';
 const timing=!s.timing?'음성에 자막을 맞추거나 발화 시간 정보를 가져와 주세요.':'';
 const board=!s.board?'현재 대본과 음성에 맞는 스토리보드를 준비하고 저장해 주세요.':'';
 const review=!s.reviewReady?'현재 작업 버전의 검수용 영상을 먼저 만들어 주세요.':'';
 const technical=!s.technicalPassed?'필수 기술 검사 결과를 확인하고 검수용 영상을 다시 만들어 주세요.':'';
 return {
  voice:common||voice||(!s.voiceNotes?'음성을 들어보고 확인 내용을 입력해 주세요.':''),
  request:common||(s.active?active:'')||voice||approval||timing,
  review:common||voice||approval||timing||board,
  approve:common||review||technical||(!s.visualNotes?'영상을 재생해 화면과 음성을 확인하고 결과를 입력해 주세요.':''),
  final:common||(s.active?active:'')||(!s.finalReady?(voice||approval||timing||board||review||technical||(!s.reviewApproved?'영상 검수 확인을 완료해 주세요.':'현재 제작 조건과 검수 기록을 다시 확인해 주세요.')):''),
  feedback:common||(s.active?active:'')||review||(!s.feedback?'수정할 부분과 원하는 방향을 입력해 주세요.':''),
 };
}
