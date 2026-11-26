import type {Project} from '../core/project';
import type {AgentStage} from '../core/agent-task';

// Display labels only. Persisted values and API contracts stay unchanged.
export const timingSourceLabels: Record<Project['timingSource'], string> = {
  demo:'데모용 시간 정보', srt:'SRT에서 가져온 발화 시간', whisper:'Whisper 음성 인식',
  'elevenlabs-tts':'AI 음성의 발화 시간', 'elevenlabs-align':'ElevenLabs 음성 정렬',
  manual:'직접 편집한 시간 정보', unverified:'발화 시간 확인 전',
};
export const colorLabels: Record<keyof Project['theme'], string> = {
  background:'배경색', foreground:'글자색', accent:'강조색',
};
export const sceneLabels: Record<Project['scenes'][number]['kind'], string> = {
  hook:'도입', orbit:'중심과 주변 요소', compare:'비교', steps:'단계별 설명', closing:'마무리',
};
export const captionTimeLabels = {startMs:'시작 시간(ms)', endMs:'종료 시간(ms)'} as const;
export const agentStageLabels: Record<AgentStage, string> = {
  queued:'전달 대기', working:'작업 기록 중', 'storyboard-ready':'스토리보드 준비 완료',
  'review-ready':'검수 영상 준비 완료', blocked:'작업 중단', completed:'결과 전달 완료', cancelled:'작업 취소됨',
};
export function renderStatusLabel(status:string):string {
  switch(status){
    case 'running':return '영상을 만들고 있어요';
    case 'done':return '영상 파일이 준비됐어요';
    case 'error':return '영상을 만들지 못했어요';
    case 'cancelled':return '영상 만들기를 취소했어요';
    default:return '작업 상태 확인 필요';
  }
}
