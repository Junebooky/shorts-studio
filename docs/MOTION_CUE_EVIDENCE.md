# Speech cue evidence (follow-up)
Scope: existing optional word-triggered graphic cues only; no new effects, shared schema or renderer changes.
- The compiler reconstructs indexed word evidence from the original timestamp segments and requires exact agreement with the flat word list (text, start, end, reported confidence).
- A selected anchor must be inside its scene, belong to a segment whose word text matches the segment text after speech normalization, contain letters/digits and meet the existing confidence threshold (0.5 when reported).
- At the composition's current 30 FPS, there must be a rendered frame inside the word interval. Onset uses ceil(ms * fps / 1000). If the word ends before any representable frame, reject it; never invent an earlier cue time. Other frame rates can be passed explicitly to the resolver.
- No cues still means the ordinary style stagger, not verified speech timing. The renderer's reveal duration, framing and visual design are unchanged; the checker does not prove perceptual sync or semantic correspondence. A user/agent still reviews actual playback.
- `assertResolvedCues` reconstructs stored cues and compares exact recorded timestamps. A01 may call it from shared project validation after reviewing the contract; direct persisted-project validation has not been changed in this PR.
- Synthetic unit and storyboard integration tests: `npx tsx --test tests/motion-cues.test.ts tests/storyboard.test.ts`. The dedicated workflow runs for stacked A03 and main-targeted PRs. No provider credentials or personal audio.
