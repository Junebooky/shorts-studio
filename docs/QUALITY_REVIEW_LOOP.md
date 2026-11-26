# Bounded local revision/recheck loop (A02 follow-up)
This is a stacked follow-up to frozen #9, not a change to the frozen branch. It is a local orchestration contract for the single existing production agent, not a model launcher, automatic project editor, or approval mechanism.
 
## CLI
Create a plan using the current critic/revision workflow, then:
- `npx tsx scripts/quality-loop.ts start PROJECT_ID PLAN.json [maxRounds]` — explicit start, default 3, maximum 5. The plan must match the current real review request and pass technical checks. Returns a loop ID and first active plan.
- `npx tsx scripts/quality-loop.ts status PROJECT_ID LOOP_ID` — reads the local ledger and derives status/next plan. Does not certify that the project is still current.
- Use the selected plan as advisory input to the one production agent, save a newer revision, and render a new review using the existing workflow.
- `npx tsx scripts/quality-loop.ts prepare PROJECT_ID LOOP_ID` — validates current review/frame hashes and protected inputs; exports recheck request and local PNG directory.
- Inspect actual images and return the existing RecheckResult JSON with the active plan ID.
- `npx tsx scripts/quality-loop.ts record PROJECT_ID LOOP_ID RESULT.json` — validates fresh evidence, serializes the update, persists the round, and derives a next advisory plan only for tasks marked persists. Its critique-like data is explicitly derived from recheck notes, not a new full-scene critic evaluation.

## Stop rules
Technical failure, uncertain or unreviewed task, all selected tasks reported improved (manual review only), persistent tasks with unchanged cited image hashes, two consecutive rounds without improvement, or configured round limit stop the loop. New or unrelated visual defects require a fresh critic review; they are not automatically found by this loop. A human must still check the complete video, audio and facts. The user can stop invoking the CLI at any time. No background execution, automatic AI calls, automatic saving, or automatic approval. No automatic resume after a stop condition; start a new loop with a fresh current plan.

## Local persistence and source guard
Ledger: workspace/projects/PROJECT_ID/production/quality-loops/UUID.json. Atomic temp + publish, exclusive per-loop lock for record; state is recomputed from validated rounds. A crash can leave a lock; only remove it after confirming no active process. Files are local user-controlled, not tamper-proof or authenticated, and no private data should be committed or shared. Initial publish uses same-filesystem hard link; network filesystems and OS-specific behavior beyond Linux CI are not verified.
Source fingerprint covers script, narration path and bytes, duration, timing source, captions, analysis, selected style ID, reference brief, music placement and scene IDs/times. It detects drift when preparing/recording, not before an external editor saves; it does not rollback changes, enforce visual-only edits, verify every asset byte, or cover future shared schema fields. A01 must integrate full source provenance and shared production job coordination before autonomous execution. A02 uses current productionState and actual PNG hashes; old imported recheck judgments are not independently authenticated. Synthetic CI outcomes test contracts, not actual model evaluation.
