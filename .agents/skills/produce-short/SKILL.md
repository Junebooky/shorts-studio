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

## Master Timeline
project.analysis는 실제 SRT 또는 Whisper JSON에서 생성한 발화 구간, 어절, 타임스탬프상 공백, 원문 일치율 및 검수 문제를 담는다. 일치율은 음성 인식 정확도나 실제 싱크 보증이 아니다. 원문 불일치는 원본 음성과 함께 확인하고 임의 시간 배분하지 않는다. sourceScript/sourceAudio/durationMs가 달라지면 다시 분석한다. scene 타이밍은 검증된 발화 구간을 기준으로 작성한다.

선택적으로 MotionCraft 원본 어절 추출 도구(vendor/motioncraft/whisper_words.py)를 npm run transcribe -- ID --faster로 사용한다. 원본 음성에 VAD를 적용하더라도 음성 파일을 자르거나 속도를 바꾸지 않는다. 합성 테스트 음성에서의 성공을 실제 고객 음성 싱크 검증으로 간주하지 않는다.

## 구조화된 아트 디렉션
`npx tsx scripts/storyboard.ts draft ID`로 원문 타이밍 근거를 얻고 docs/STORYBOARD.md와 src/core/storyboard.ts를 읽는다. AI 메인 에이전트가 의미별로 장면을 묶고 purpose/metaphor 및 visual을 작성한다. 빈 draft는 결과물이 아니다. 실제 음성 확인 후 필요한 경우 review acknowledgement를 기록한다. `npx tsx scripts/storyboard.ts apply ID FILE`로 검증하고 저장한다. 단일 장면 템플릿을 반복하지 않는다. 실제 발화 앵커는 임의 시간으로 변경하지 않는다.

연출 전 `.agents/skills/remotion-production/SKILL.md`를 읽고 필요한 고정 upstream 참조를 확인한다. ASR 불일치 후보는 기존 자막을 덮어쓰지 않으며 candidate.json을 검수한다. 낮은 confidence는 원문 텍스트 일치 여부와 관계없이 검수 대상으로 간주한다.
