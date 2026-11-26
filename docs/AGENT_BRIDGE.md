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
