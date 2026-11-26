# Progressive content creation (design proposal)
User correction: preserve OSMU behind the scenes; do not show a common-source card to someone making one format, or surface multiple workspaces before the first output exists.

## Flow
- Home: format multi-select + topic + optional pre-authored script; one primary CTA. No common-source card. Save plan silently; no paid requests.
- If video is selected, enter video wizard first. Topic/brief -> script generation and explicit approval -> existing brand palette -> voice -> production. No parallel cards/thread workspace actions. Single video plan ends with video review/export only.
- Once a successful saved video draft is displayed, allow review and explicit continuation. If card is selected, one CTA '이 영상으로 카드뉴스 만들기'. If only thread is additionally selected, one CTA '이 영상으로 스레드 만들기'. Do not force conversion, payment or navigation.
- Card work: use the already captured real source revision, current shared renderer; show no giant source card. Optional collapsed origin details only. After successful card save, expose the selected thread as the one next step. If user skips a derivative, record explicit skip, do not pretend saved. When all selected formats are saved/skipped, return to home or results with a compact summary.
- A single-format plan hides other formats, even after completion; optional repurpose can remain a deliberate independent action from the library. No unselected default suggestion.
- Persist stage with plan/source ID and revision, distinguish draft-ready vs final video review, unsaved card/threads, skip and save. Resume one next action after reload. Preserve direct standalone sidebar tools, protect unsaved content, and never overwrite a captured revision silently.
- Non-video card/thread combinations use the same one-at-a-time pattern. Source detail is optional only if it adds value. Existing card assets omission/thread text-only limits remain explicit.

## Acceptance
1. Single video never displays common-source panel or other format CTA.
2. Multi-format with video: before successful capture no derivative actions; failure/partial job does not unlock.
3. Card first after video if selected; thread only after card save or explicit skip. After reload, resume the correct step, including current plan identity and revision.
4. No unselected format CTA, no extra generation request, no changes to already completed assets.
5. Mobile/desktop: one primary action, no duplicated cards. Existing independent editors remain reachable.
This document is a proposal, not implementation. Coordinate workspace owners and migrate existing persisted state/tests before changing navigation.
