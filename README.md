# Shorts Studio
대본과 AI 성우 음성으로 모션 그래픽 숏츠를 제작하는 로컬 우선 스튜디오. 자동 생성 품질을 우선하며 웹 UI는 Protocol Cockpit(driver-eta-notifier)의 코발트 블루/라이트 디자인을 계승합니다.

## 시작
Node.js 22+, npm. 현재 v0.1 소스 단계이며 lockfile이 아직 없으므로 처음에는 npm install을 사용하세요.
```sh
git clone https://github.com/Junebooky/shorts-studio.git
cd shorts-studio
npm install
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
[검증 상태](docs/STATUS.md) · [오픈소스 참조](docs/REFERENCES.md) · [에이전트 규칙](AGENTS.md). 설치/렌더링 테스트 미실행. Remotion 및 외부 패키지에는 별도 사용 조건이 적용됩니다.

데모를 복제하면 기존 무음 장면을 직접 편집할 수 있습니다. `npx remotion skills add`로 공식 스킬을 설치할 수 있습니다. 고급 카메라 연출 원본 참고 모듈은 `vendor/skills/cinematic-camera/`에 포함되어 있습니다.
