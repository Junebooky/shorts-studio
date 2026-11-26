// Copy for the actual guided creation flow. No navigation or API logic.
export const guidedSteps=['주제와 제작 방향','영상 스타일','목소리 선택','제작 및 결과'] as const;
export const guidedHeadings=['어떤 영상을 만들까요?','어떤 스타일이 좋을까요?','어떤 목소리가 좋을까요?','선택한 내용을 확인해 주세요'] as const;
export const guidedNext=['스타일 고르기','목소리 고르기','선택 내용 확인'] as const;
export const voiceIdFormatHint='목소리 ID는 영문, 숫자, 밑줄, 하이픈으로 1~80자 입력해 주세요.';
export function guidedNextHint(step:number,subject:boolean,voiceValid:boolean,voiceEntered:boolean):string{
 if(!subject&&step<3)return '영상 주제나 제작 목적을 입력해 주세요.';
 if(step===2&&!voiceValid)return voiceEntered?voiceIdFormatHint:'목소리를 선택하거나 ID를 입력해 주세요.';
 return '';
}
export function personaPreviewLabel(name:string,playing:boolean):string{
 return name+' '+(playing?'미리 듣기 멈추기':'미리 듣기');
}
export function personaLanguageLabel(korean:boolean):string{
 return korean?'한국어 정보 있음':'한국어 지원 확인 전';
}
