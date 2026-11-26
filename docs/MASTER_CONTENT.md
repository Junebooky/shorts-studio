# OSMU — One Source, Multi-Use (designer)
User correction: the multi-select on marketing home is a request for derivative outputs of one source, not a list of unrelated editor shortcuts. The already updated brand-color picker is out of scope.

## Contract
- When video and other formats are selected, complete the source video first; use its real saved project ID and revision. No independent AI generation for derivatives. Link every page/post to the source scene ID.
- Reuse the actual selected palette, storyboard visual descriptor, graphic renderer, and placed production asset (including original media offset); do not implicitly promote reference-only assets or insert fabricated graphics. Preserve source script and captions, assign captions to one scene by start time.
- Card 4:5 and 1:1 use a new responsive layout, not a crop of the whole 9:16 frame. The common existing EditorialGraphic/SceneMedia components are reused; final scene-local frame is the initial deterministic still, not a quality guarantee. Legacy scenes without a reusable visual or media remain text-only in this increment.
- Threads draft is ordered source text with scene references; image attachment comes from the same card renderer. No external posting.
- Card-only or thread-only should eventually prepare a common source without generating paid voice or MP4 unnecessarily. Existing independent card-only editing must remain available.
- Source revisions must be pinned. Source changes require explicit refresh; never overwrite an edited derivative or the original video. Final approval remains independent for each format.

## This increment
Pure source adapter, static Remotion composition using existing graphics/media, revision-checked local PNG renderer, and unit tests. No provider requests or brand-color changes. Draft integration: successful quick completion callback binds a matching launch ID; multi-format card/thread buttons wait for source; preview and explicit single-page PNG export use the same Remotion composition. Source link is session-only; card-only retains existing editor, thread-only remains pending. No derivative editing/persistence/bulk export. A01 review of shared App/API contracts and existing PR reconciliation required. Browser and actual PNG verification remain pending. No claim of final QA or platform publication.
