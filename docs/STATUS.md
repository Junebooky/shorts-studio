# v0.1 verification
Source implementation: React/Vite/Tailwind v4 cockpit-inspired UI, shared Remotion composition/renderer, local project storage, SRT import, optional local Whisper, editable themes/captions, frame QA, actual waveform, scene seek, AutoBroll keyframe utility and cinematic-camera reference.
First CI run: https://github.com/Junebooky/shorts-studio/actions/runs/45758322544
- npm install, typecheck, automated unit tests, web build, still rendering and MP4 render command passed.
- Nonempty MP4 output confirmed by test -s; final ffprobe check failed because runner did not have ffprobe on PATH. Corrected workflow uses bundled Remotion ffprobe; rerun required. Render logs also contain a recovered Chromium Target closed warning.
- Generated artifact: https://github.com/Junebooky/shorts-studio/actions/runs/45758322544/artifacts/15087779545 (demo + stills + lockfile).
Outstanding: current authoring environment cannot access npm registry; full browser UI visual review, real Korean narration/sync, Windows local tests, package-lock commit, Whisper/forced alignment tests, advanced drag timeline, automatic pixel critic and broader upstream integrations remain unverified. Demo intentionally silent with illustrative timestamps. AI handoff uses Antigravity copied prompt, not an integrated AI API. Do not treat this as production-ready.

Follow-up CI https://github.com/Junebooky/shorts-studio/actions/runs/45758646531: all steps passed, including MP4 output codec and dimensions. Downloaded first artifact, independently ffprobed: H.264 1080x1920, 30fps, 12.053s (AAC silent track). Representative 3 still frames visually inspected, Korean rendered correctly; this is not a full visual/motion or speech-sync review. Lockfile generated in successful CI, blob verified against first artifact (30f75d594e1c88b39e1515748cc8e9d539224bf2), now checked in. npm ci verification starts on this commit.

## v0.2 increment A
Added conservative script-to-transcript normalization/alignment, measured segment/word evidence, timestamp gaps, mismatch review, JSON import and Whisper word output. UI border reduction and design rule applied. Prior npm ci run 45758914717 passed. This increment requires new CI verification. This is not acoustic forced alignment; no real narration quality or browser UI visual review yet.
