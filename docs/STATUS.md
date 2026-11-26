# v0.1 verification
Source implementation: React/Vite/Tailwind v4 cockpit-inspired UI, shared Remotion composition/renderer, local project storage, SRT import, optional local Whisper, editable themes/captions, frame QA, actual waveform, scene seek, AutoBroll keyframe utility and cinematic-camera reference.
First CI run: https://github.com/Junebooky/shorts-studio/actions/runs/45758322544
- npm install, typecheck, automated unit tests, web build, still rendering and MP4 render command passed.
- Nonempty MP4 output confirmed by test -s; final ffprobe check failed because runner did not have ffprobe on PATH. Corrected workflow uses bundled Remotion ffprobe; rerun required. Render logs also contain a recovered Chromium Target closed warning.
- Generated artifact: https://github.com/Junebooky/shorts-studio/actions/runs/45758322544/artifacts/15087779545 (demo + stills + lockfile).
Outstanding: current authoring environment cannot access npm registry; full browser UI visual review, real Korean narration/sync, Windows local tests, package-lock commit, Whisper/forced alignment tests, advanced drag timeline, automatic pixel critic and broader upstream integrations remain unverified. Demo intentionally silent with illustrative timestamps. AI handoff uses Antigravity copied prompt, not an integrated AI API. Do not treat this as production-ready.
