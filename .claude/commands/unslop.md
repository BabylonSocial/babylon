---
description: Remove AI slop from branch changes
allowed-tools: Bash(git:*), Read, Edit, Glob
---

!`git diff staging...HEAD`

Remove AI slop: unnecessary comments, defensive try/catch in trusted paths, `as` type assertions, verbose names, redundant null checks.

Be surgical. 1-3 sentence summary at end.
