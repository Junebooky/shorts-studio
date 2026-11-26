import type {PresetId} from '../core/styles';

// Display copy only; the renderer and agent style contracts remain in core/styles.ts.
export const styleCopy: Record<PresetId, {summary:string;detail:string}> = {
 editorial:{summary:'잡지처럼 깔끔하고 차분하게',detail:'정보와 근거를 차분하게 전달할 때 좋아요. 넓은 여백과 왼쪽 정렬로 읽는 순서를 잡아줘요.'},
 kinetic:{summary:'크고 역동적인 글자로 시선 집중',detail:'짧고 강한 메시지에 어울려요. 핵심 글자가 발화에 맞춰 등장하고 힘 있게 움직여요.'},
 data:{summary:'숫자와 관계를 한눈에',detail:'숫자, 비교, 흐름을 설명할 때 좋아요. 대본에 실제 수치가 있을 때만 차트를 사용하고, 수치가 없으면 개념을 그림으로 설명해요.'},
 cinematic:{summary:'영화처럼 깊이 있고 몰입감 있게',detail:'이야기나 분위기를 전달할 때 좋아요. 어두운 배경과 따뜻한 강조색, 부드러운 확대와 이동을 사용해요.'},
 minimal:{summary:'여백을 살려 핵심 메시지에 집중',detail:'한 가지 메시지를 선명하게 전달할 때 좋아요. 한 장면에 한 가지 핵심 내용을 담고 장식은 줄여요.'},
 illustrated:{summary:'친근한 그림으로 쉽게 설명',detail:'낯선 개념을 쉽게 설명할 때 좋아요. 둥근 형태와 아이콘, 간결한 그림을 사용해요. 참고용 파일은 영상에 직접 넣지 않아요.'},
};
