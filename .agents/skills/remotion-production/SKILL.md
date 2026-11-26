---
name: remotion-production
description: Consult pinned upstream Remotion and motion-graphics references during Shorts Studio single-agent production.
---
# Remotion production references
First follow AGENTS.md and the local produce-short skill. The user has already selected 9:16 and delegated per-video design to the main agent. Do not start another agent.
Run `git submodule update --init vendor/skills/remotion-official vendor/skills/motion-graphics-upstream` if the reference directories are empty. This fetches pinned public source only; do not execute upstream scripts without inspecting them.
- Read `vendor/skills/remotion-official/skills/remotion-best-practices/SKILL.md` and only the relevant linked sections. Official snapshot may document newer APIs than the pinned runtime 4.0.380. Check installed types and tests before using APIs; never change versions implicitly.
- For captions read the official remotion-captions skill and its local reference files.
- For high-quality art direction, reference `vendor/skills/motion-graphics-upstream/skills/motion-graphics/SKILL.md` and its references and approved media. Use visual principles, authentic assets, and relevant examples. The upstream independent-critic requirement conflicts with user-selected single-agent workflow: do not activate the upstream gate or claim its certification. Our explicit visual checks remain mandatory.
- Record actual reference assets inspected, planned visual mechanism, and what differs. Do not claim inspection without opening media.
- Keep video design distinct from driver-eta-notifier shadow-first web UI.
