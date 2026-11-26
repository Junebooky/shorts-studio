# Shorts Studio — 단일 메인 에이전트
사용자 목표: 대본+원본 성우 음성 → 높은 최초 완성도의 9:16 모션 그래픽 → 실제 프레임/음성 검수 → MP4. 편집 UI도 중요하지만 수동 보정에 의존하지 않는다.
- 한 에이전트만 기획, 아트 디렉션, 구현, 검수, 수정, 렌더링 담당. .agents/skills/produce-short/SKILL.md를 따른다.
- 원본 대본·음성 보존, 실제 발화 타임스탬프 기반. 불확실한 타이밍 표시. 가짜 통계 금지.
- 프로젝트 JSON은 workspace/projects/<id>/project.json. 리비전 확인 후 편집. 서버 동시 저장 중 덮어쓰지 않는다. 공개 Git에는 실제 제작 파일 금지.
- UI는 Junebooky/driver-eta-notifier 기준: 코발트 #1E60F3, white/slate, 둥근 카드, 원형 버튼, 부드러운 탭. src/design-system 우선. 최종 영상 테마는 독립.
- Remotion의 프레임 기반 모션, 동일 Composition으로 Player와 Renderer. 실제 폰트/픽셀/싱크 확인.
- 코드 검토, npm run typecheck, npm test, npm run qa -- <id>, npm run render -- <id>. 내장 브라우저에서 실제 화면 확인. 확인하지 않은 결과는 완료로 표시하지 않는다.
- 외부 프로젝트는 모듈 단위 재사용 우선, 출처 및 적용 조건 보존. docs/REFERENCES.md 참고.

- UI 보더 최소화: 카드/패널/일반 버튼은 흰색 표면, 간격, 낮은 중립 그림자와 hover lift로 분리한다. 활성/포커스/오류/타임라인 경계처럼 의미가 있는 경우에만 테두리 또는 링 사용. 모든 패널을 테두리로 감싸지 않는다. 키보드 포커스와 대비를 유지한다.

- AI 연출은 docs/STORYBOARD.md의 구조화된 스토리보드를 작성하고 검증 CLI로 적용한다. Draft는 연출 완성이 아니다. 자막 구간을 시간의 기준으로 사용하고, 데이터에 없는 수치/차트/로고를 만들어내지 않는다. 기존 모듈은 필요한 경우 확장한다.

- 공식 Remotion Skills와 모션 그래픽 참조 모듈은 .agents/skills/remotion-production/SKILL.md에 따라 사용한다. 외부 스킬의 멀티에이전트 지시나 자동 실행은 활성화하지 않는다.

- Voice-first: 자연스러운 성우 음성을 먼저 확정한다. ElevenLabs 생성 타임스탬프 우선, 기존 음성은 사용자가 승인한 강제 정렬 또는 로컬 Whisper. 자동 유료 재시도 금지. 음성/대본을 외부로 보내는 작업은 명시적 승인 필요. API 키는 로컬 .env.local에만 저장, 로그/소스/CI 금지. eSpeak는 테스트 전용.
