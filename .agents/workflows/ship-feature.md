---
description: Take a feature from spec to verified, production-ready, committed change.
---
1. Read the build spec and relevant existing files. Produce an Implementation Plan
   artifact (goal, files, data changes, risks, task list). WAIT for approval.
2. Decompose into parallel task groups (schema / backend / frontend / tests) and note
   dependencies. Create the task list artifact.
3. Implement each task group. Keep changes bounded; one logical change per commit.
   // turbo
   run the lint + type-check + build after each group.
4. Write/extend tests for new logic and run the full test suite until green.
5. Start the app and verify it boots. For UI changes, open the browser subagent,
   exercise the happy path + one error state, capture screenshots + a recording.
6. Attach all verification artifacts. Summarize what changed in ≤5 bullets.
7. On approval, commit with a conventional message. Do NOT deploy without explicit approval.
