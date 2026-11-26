# Agent Bridge — local file exchange
The platform creates an immutable task-specific request under workspace/projects/ID/production/agent/TASK-request.json. active.json records real milestones and notes. No automatic IDE invocation or fake progress. Copy the request command into the one Antigravity main agent. Agent reads current project and request; if queued revision changed, cancel and re-request. Use:
npx tsx scripts/agent.ts status ID
npx tsx scripts/agent.ts advance ID TASK_ID working "actual start"
npx tsx scripts/storyboard.ts draft ID / apply ID FILE (separate commands)
npx tsx scripts/agent.ts advance ID TASK_ID storyboard-ready "what was implemented"
npx tsx scripts/production.ts review ID
npx tsx scripts/agent.ts advance ID TASK_ID review-ready "actual preview generated, issues found"
npx tsx scripts/agent.ts advance ID TASK_ID completed "handoff, unresolved issues"
Completed means handoff, not quality approval. blocked requires actual reason and can resume working. UI cancel marks task only, does not stop IDE process. Task events are local, no paid calls. User feedback on actual review starts a new task after previous one completes/cancels, invalidates prior render and approval, and is included in immutable manifest. Preserve voice/style unless user requests changes. Agent reports progress only after actual milestone; never mark uninspected results approved. If crash leaves write.lock, confirm no active writer before manually removing. This file-based bridge is not an IDE API integration. UI polls task records, not agent process health. Project reload still manual when agent saves externally.
Final production export is blocked while a task is active; the task must be completed or cancelled, and current visual approval must still be valid. The agent's completion is not an approval. CI uses synthetic fixtures and marks test-only milestones.

Request context v1 includes full saved project snapshot and voice review, local only. Browser polls lightweight saved revision endpoint and offers explicit reload; unsaved edits are preserved until user confirms discard. Save and production actions are blocked on detected newer revision; server optimistic revision check remains authoritative. No direct IDE invocation.

## Task result provenance (A01 #10)
Current task request snapshot fixes script, original audio bytes/path, duration, timing, captions, chosen style, creative brief, reference instructions and existing asset metadata. Creative outputs may change, and new production assets may be added. Changed source/reference inputs require cancellation and a fresh request. Checks happen at working/storyboard-ready/review-ready/completed, not at arbitrary file edits; this is a local collaboration contract, not a sandbox. Review-ready records revision, actual review run UUID, technical status and representative frame count in active task. Completion requires the same revision/run. If re-rendered, transition back to working and record new milestones. A failed technical report may be handed off honestly but cannot be approved for final output. Task result does not imply human visual/voice approval. Legacy requests without snapshots must be recreated. UI displays stale/current evidence; all records stay local.

## Local inbox
See docs/AGENT_INBOX.md. The one user-directed agent can list and inspect local tasks, explicitly claim a queued task with its project/task IDs, then use existing milestones. No IDE process is started by these commands, no automatic polling or paid calls.
