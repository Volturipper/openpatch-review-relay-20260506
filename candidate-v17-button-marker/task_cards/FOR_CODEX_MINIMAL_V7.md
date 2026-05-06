# FOR_CODEX_MINIMAL_V7

Task: smoke-test v7 locally in an isolated project directory only.

Default actions allowed: run `npm test`, `npm run check`, start Local Bridge on a chosen port, call CLI health/compact-summary/archive-base64 dry-run/queue-stats, inspect JSON evidence.

Do not use real GitHub token unless owner gives action-time approval for a single test archive repo.

Return: command list, JSON evidence paths, pass/fail summary, console errors if any.
