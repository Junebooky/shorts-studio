# References and integration
- driver-eta-notifier @ 503e99c856ade6e11e43412cc579d7faf920477e: Header, ActionPanel, ScheduleCard, page sliding tabs, globals.css. UI tokens / JSX class patterns adapted; no driver business logic.
- https://github.com/remotion-dev/remotion: Player, renderer, bundler pinned 4.0.380.
- https://github.com/remotion-dev/skills: official skills candidate; install with npx remotion skills add after dependency installation. Not yet installed.
- https://github.com/Liamrjohnston/remotion-motion-graphics-skill @ b860c7921f2220b9e2a84e815ba0ae7b10858f08: cinematic-camera skill candidate; use as upstream module only after checking references.
- https://github.com/ahmdd4vd/MotionCraft @ 8f4871543399c1981c247b734d9a123e6a6feb7a: production flow and pixel/audio QA. README and template package inspected; full module not integrated.
- https://github.com/derek-zhuolin/motion-skill: README inspected; voice-driven workflow reference.
- https://github.com/andriidrok1/autobroll @ 4aef3afb099c866bd2977c184f9912ba57318f77: README, package and captions.ts inspected. Timeline/caption module candidate; not copied into engine yet.
- https://github.com/nexu-io/openmotion: README inspected; UI and reference workflow candidate.
Candidate ranking is based on technical fit, not license type. Preserve upstream notices and verify redistribution obligations before publishing imported modules. No upstream install, visual comparison or rendering verified in this environment.

- Exact upstream cinematic-camera SKILL.md and LICENSE imported in vendor/skills/cinematic-camera (reference module, not yet runtime-validated). Original companion skill still pending.

- AutoBroll timeline.ts and MIT notice vendored verbatim in src/vendor/autobroll; sampleTransform now drives graphic camera keyframes. Web Audio waveform is a native implementation, not copied.

- MotionCraft @ 8f4871543399c1981c247b734d9a123e6a6feb7a: original whisper_words.py + LICENSE imported into vendor/motioncraft. Adapter groups actual word intervals and retains confidence. Local faster-whisper dependency/model installation and actual ASR execution not yet verified.

- MotionCraft flat word JSON may also be imported in browser. The optional actual faster-whisper runtime still requires verification.

- FLEURS (Conneau et al., 2022), https://huggingface.co/datasets/google/fleurs, CC BY 4.0, Korean test row 0. Public ASR fixture fetched at CI runtime; no user data or raw public voice committed. Report records source.

- Remotion official skills pinned as git submodule a3f4098a2afd0e13f6a6f8c8760e275f75457ea9. Upstream version may exceed installed Remotion 4.0.380; reference-only and API checks required.
- Full motion-graphics upstream reference repository pinned as git submodule b860c7921f2220b9e2a84e815ba0ae7b10858f08. Upstream independent critic gate is not used (single-agent requirement); references and approved assets available on init. No authorization/certification claims.
- FLEURS direct dataset-server request returned HTTP 500; switch to pinned parquet 44ebc3e0222cda1571220d148f3e3163843747dd via HF Hub.
