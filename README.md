# Shorts Studio
대본과 AI 성우 음성으로 모션 그래픽 숏츠를 제작하는 로컬 우선 스튜디오. 자동 생성 품질을 우선하며 웹 UI는 Protocol Cockpit(driver-eta-notifier)의 코발트 블루/라이트 디자인을 계승합니다.

## 시작
Node.js 22+, npm. 현재 v0.1 초기 버전이며 CI에서 생성 및 검증한 lockfile을 포함합니다.
```sh
git clone https://github.com/Junebooky/shorts-studio.git
cd shorts-studio
npm ci
npm run dev
```
http://127.0.0.1:5173 (로컬 전용). 최초 렌더링 시 Chromium 다운로드가 필요할 수 있습니다.
데모는 12초 무음 디자인 데모입니다. 실제 성우 음성이 포함된 데모는 미완료입니다.

## 제작
새 프로젝트 → 대본 입력 → MP3/WAV 업로드 → SRT 가져오기 또는 로컬 Whisper 실행 → 저장 → AI 제작 명령 복사 → Antigravity 메인 에이전트에 전달 → 작업 완료 후 새로고침 → 미리보기 및 필요시 수정 → MP4 렌더링.
웹 버튼은 AI 모델을 직접 실행하지 않습니다. 에이전트가 파일 및 Remotion 컴포넌트를 수정하는 구조입니다.
실제 음성 기반 타임스탬프를 사용하고 원본 대본과 정렬해야 합니다. 장면이 전체 길이를 덮기 전에는 렌더링 오류가 표시됩니다.
```sh
npm run doctor
npm run typecheck
npm test
npm run build
npm run studio
npm run qa -- demo
npm run render -- demo
```
Whisper는 선택 기능: Python, FFmpeg, openai-whisper 설치 및 모델 다운로드 필요. `npm run transcribe -- PROJECT_ID`. 실제 발화/원문 정렬은 에이전트가 검수합니다.
개인 프로젝트는 workspace/ 및 public/workspace/에 저장되며 Git 제외. 출력은 out/ 아래. 서버를 인터넷에 공개하지 마세요.
## 개발 상태
[성공한 CI](https://github.com/Junebooky/shorts-studio/actions/runs/45758646531)
[검증 상태](docs/STATUS.md) · [오픈소스 참조](docs/REFERENCES.md) · [에이전트 규칙](AGENTS.md). 첫 GitHub CI의 패키지 설치/타입 검사/테스트/빌드/스틸/MP4 렌더링 단계는 통과했습니다. 이후 수정된 CI에서는 출력 규격 검사까지 통과했습니다. Remotion 및 외부 패키지에는 별도 사용 조건이 적용됩니다.

데모를 복제하면 기존 무음 장면을 직접 편집할 수 있습니다. `npx remotion skills add`로 공식 스킬을 설치할 수 있습니다. 고급 카메라 연출 원본 참고 모듈은 `vendor/skills/cinematic-camera/`에 포함되어 있습니다.

첫 CI에서 만든 샘플 MP4와 프레임: [Actions artifact](https://github.com/Junebooky/shorts-studio/actions/runs/45758322544/artifacts/15087779545).

## v0.2 개발 단계: Master Timeline
원본 대본/음성을 먼저 등록한 뒤 SRT 또는 Whisper JSON을 가져오면 발화 구간을 유지하면서 정규화된 원문 텍스트 일치 여부를 검사합니다. Whisper CLI는 어절 추정 시간과 confidence를 포함하는 JSON을 저장합니다. 불일치 구간 및 타임스탬프상 공백은 오른쪽 Master Timeline에서 확인할 수 있습니다. 실제 음성 강제 정렬과 무음 파형 분석은 아직 별도 단계이며, 텍스트 일치율은 실제 싱크 보증이 아닙니다. UI는 [shadow-first 디자인 규칙](docs/DESIGN_SYSTEM.md)을 따릅니다.

### 선택: MotionCraft faster-whisper 모듈
Python 환경에서 `pip install faster-whisper` 후 `npm run transcribe -- PROJECT_ID --faster`를 실행하면 가져온 원본 MotionCraft 모듈이 VAD 및 어절 시간 추정을 수행합니다. CPU/GPU 및 모델 다운로드 조건은 환경마다 다릅니다. 원본 대본 정렬은 동일한 Master Timeline 계층으로 처리합니다. 실제 ASR 실행은 별도 검증이 필요합니다.
### 음성 출력 테스트
Linux에서 eSpeak NG 설치 후 `python3 scripts/voice-fixture.py`, `npx tsx scripts/voice-fixture.ts`, `npm run qa -- voice-fixture`, `npm run render -- voice-fixture`. CI의 voice-smoke 작업도 같은 절차를 수행합니다. 이는 로컬 합성 한국어 음성과 측정한 문장 단위 경계의 테스트이며 고급 AI 성우 또는 ASR/강제 정렬 품질 검증은 아닙니다.

ASR 실제 실행 검사: GitHub Actions의 Local Korean ASR integration은 공개용 합성 fixture를 사용해 MotionCraft faster-whisper base 모델을 실제 호출하고 문자 오류율, 원문 일치율 및 검수 문제를 기록합니다. 실제 성우나 강제 정렬 품질 보증은 아닙니다. 모델 선택 예: `npm run transcribe -- PROJECT_ID --faster --model=base`.

## 구조화된 스토리보드
`npx tsx scripts/storyboard.ts draft PROJECT_ID` → 메인 에이전트가 연출 JSON 작성 → `npx tsx scripts/storyboard.ts apply PROJECT_ID FILE` (또는 웹에서 JSON 가져오기). 자막 ID를 연결해 장면 시간을 자동 결정하고, 시각적 목적과 비유를 저장합니다. [스키마 및 가이드](docs/STORYBOARD.md). 별도 AI API 자동 호출은 없습니다.

불일치 ASR 결과는 `workspace/projects/ID/transcription/candidate.json`에 별도 저장되며 기존 자막을 덮어쓰지 않습니다. 검수 후 정확한 SRT/JSON을 가져오세요. 실제 발화 검증에는 공개 FLEURS 한국어 test 샘플을 사용하며, 사용자 음성은 CI로 전송하지 않습니다.

### 제작 Skills 원본 가져오기
`git submodule update --init vendor/skills/remotion-official vendor/skills/motion-graphics-upstream` (또는 처음부터 `git clone --recurse-submodules ...`). 원본 공식 Remotion Skills와 모션 그래픽 참조를 고정 커밋으로 제공합니다. 단일 에이전트 제작 규칙은 `.agents/skills/remotion-production/SKILL.md`를 따르며 외부 스크립트를 자동 실행하지 않습니다.

## Voice-first · ElevenLabs
`.env.example`을 `.env.local`로 복사하고 재발급한 API 키를 로컬에서 설정 후 서버 재시작. 한국어 Voice ID 선택 → 대본 저장 → AI 음성 생성 + 타이밍 → 재생하여 품질 확인 → 스토리보드 제작. 이미 음성이 있으면 현재 음성 강제 정렬. 유료 요청은 사용자 확인 후에만 실행하며 CI는 모의 응답만 사용합니다. [제작 전략](docs/VOICE_FIRST.md).

## 모션 그래픽 스타일 갤러리
에디토리얼, 키네틱 타이포, 데이터 인포그래픽, 시네마틱, 미니멀, 벡터 일러스트 또는 AI 자동 선택. 실제 Remotion 썸네일과 6초 무음 샘플을 비교해 선택하고 저장하세요. 사용자 선택은 스토리보드 컴파일과 최종 렌더에 적용됩니다. [스타일 가이드](docs/MOTION_STYLES.md).

## 제작 워크플로우
[Production-first 가이드](docs/PRODUCTION_PIPELINE.md): 저장 → 음성 청취 확인 → 타이밍 → 스타일 → AI 제작 요청 파일 → Antigravity → 스토리보드 → 검수용 영상/프레임 → 검수 확인 → 최종 MP4. 초안 렌더는 검수용이 아니며 최종 품질 승인과 구분합니다.

[Agent Bridge](docs/AGENT_BRIDGE.md): 작업 ID, 실제 단계 기록, 웹 상태 표시 및 검수 후 수정 요청. IDE 자동 호출은 아직 지원하지 않습니다.

[소재 및 레퍼런스 관리](docs/ASSETS.md): 프로젝트별 로컬 소재, 제작용/참고용 구분, 활용 지침, AI 요청 연결, 장면 이미지/영상 및 배경음 배치. 저장 및 렌더 검증 적용.

[Quality Manager](docs/QUALITY_MANAGER.md): 실제 MP4 기술 검사 및 대표 프레임 갤러리, 기술 오류 차단, 별도 시각/청취 검수.
