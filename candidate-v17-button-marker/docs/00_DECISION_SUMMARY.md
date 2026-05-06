# Decision Summary

## Role

Web AI design/development assistant producing a candidate package. Final owner approval remains with the user.

## Goal

Make OPENPATCH easier for Codex, ChatGPT Auto Continue, and other agents to control across many pages, browsers, API-key aliases, and GitHub repositories.

## v3 status

✅ Implemented archive-only RoundPack mode.
✅ Implemented structured receipt/latest output.
✅ Implemented page event trigger API.
✅ Implemented local bridge MVP skeleton.
✅ Ran extension tests and syntax checks.

## Not finished

⬜ Full route-profile resolver from URL/chat/page metadata.
⬜ Local bridge authenticated key-alias upload execution.
⬜ Queue/concurrency lock for many browsers uploading at once.
⬜ GitHub Action validation workflow for RoundPack contents.
⬜ End-to-end test in real browser profile.

## Efficiency direction

Codex should be able to query, fetch, validate, retry, and continue through compact APIs instead of reading long chat history or inspecting page screenshots.
