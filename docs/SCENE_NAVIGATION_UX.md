# Scene-centered video review and editing
User goal: premium, intuitive video production UI as one module of the marketing platform. This PR is independent of platform shell #50 and avoids duplicating guided creation/voice picker in #41/#44. Integrate SceneNavigator within the detailed video workspace when merging those changes.
- Real Remotion Player frameupdate/seeked events drive active scene and caption state. Previous/next, timeline and scene list seek to renderer frameAt (ceil), pause for inspection. No guessed progress.
- Current scene displays existing headline, type, intent, cue count and overlapping captions; clicking a caption seeks within that scene only. No modification of original audio, timings or motion design.
- "이 장면 편집" switches existing editor mode and focuses that scene's existing title field. Disabled for demo, busy/rendering or remote revision conflict; editing still uses existing update/undo/save paths. Headline limited to existing schema 80 chars.
- Existing panels and edit fields remain visible; this increment adds focused navigation, not a new timeline editor. No drag trimming, regeneration, automatic quality approval, provider calls or new render engine. UI preview is the existing real Player, not mock thumbnails.
- Dedicated unit tests and Playwright workflow cover exact fractional frame edges, caption overlap, demo seek, edit focus/persistence and mobile navigation. Actual browser screenshots and CI must be checked before merge. A01 coordinates shared App changes and #50/#41 integration.

## Focused editor polish (user direction)
- Focused edit hides the redundant current-scene information card; timeline, scene list, previous/next and real frame sync stay. Advanced tools retain original intent/cue/caption detail and edit shortcut.
- The first right-column card is the actual scene title and captions editor, with caption time buttons for exact seek. Project title is a single editable header above the live player (demo read-only; duplicate action retained).
- The edit-only palette is horizontal three-color swatches, names and accessible selected state. No duplicated sample text/image. Creation and advanced palette gallery are unchanged. Preview/cancel/apply/save semantics and original project assets/audio/timing preserved.
- Browser acceptance checks no duplicate detail, scene order and editing, compact swatches, real player color, cancel/apply persistence, advanced detail and mobile overflow. CI and visual review required before merge.
