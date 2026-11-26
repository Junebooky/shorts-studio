---
name: produce-short
description: Produce a polished Korean vertical motion-graphics short from script and narration, with actual timing, visual review, revision and rendering.
---
# 제작 절차
1. project.json 및 원본 음성을 읽고 파일 존재, 길이, 타임스탬프를 검증한다. 타임스탬프가 없으면 npm run transcribe -- ID 또는 사용자 SRT를 사용한다. 원문과 실제 발화의 차이를 확인하고 불확실한 구간을 보고한다. 문자 수로 시간 추정 금지.
2. 대본의 훅, 핵심 메시지, 대비/변화, 감정 리듬을 분해한다. 각 장면의 목적과 시각적 비유, 강조 타이밍, 색상과 타이포를 정한다. 숫자와 통계는 제공된 사실만 사용한다.
3. upstream 스킬 중 필요한 것만 읽는다. 현재 레포 데이터/규칙이 우선이다. 장면 타입은 제한 없이 엔진에 등록하여 확장한다. 텍스트만 반복하지 말고 의미에 맞는 원본 SVG/React 모션 구현. 1080×1920, 30fps, 안전 여백 상180 하440 좌72 우174.
4. 변경 전 리비전 확인, 기존 편집 보존. 실제 발화 구간에 맞춘 장면과 자막을 작성한다. project.json 저장 후 새로고침. UI 데이터와 렌더링 컴포지션 동일.
5. npm run typecheck 및 npm test, npm run qa -- ID. 브라우저로 localhost:5173을 열어 전체 장면과 전환, 긴 자막, 안전 영역, 재생 음성 확인. 실제 렌더링 PNG를 열어 픽셀 검사한다. 기술 오류는 즉시 수정.
6. npm run render -- ID --preview로 검수용 영상을 만들고 실제 영상/음성을 확인한다. 최대 3회 개선. 미적 기준: 메시지 적합성 20, 디자인 20, 싱크 20, 모션 15, 가독성 10, 리듬 10, 기술 5. 자체 평가는 참고값이며 실제 검수 증거가 우선.
7. npm run render -- ID로 최종 MP4. 가능하면 ffprobe로 1080×1920, H264/AAC 및 음성 유무, 길이 확인. 출력 경로, 수정 내용, 미검증 항목을 보고한다. 음성 없거나 싱크 미검증이면 완성된 내레이션 영상이라고 표시 금지.

## 참고 모듈
연속 공간/카메라 연출이 적절한 경우 vendor/skills/cinematic-camera/SKILL.md를 읽는다. 원본 규칙 중 출력비율과 테마에 관한 요구는 이미 확정된 사용자 요구가 우선이며, 이 파일은 별도 에이전트가 아니다. 공식 Remotion 스킬 설치는 README 참고.
