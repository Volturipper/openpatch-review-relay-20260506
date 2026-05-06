# Chrome Dev Profile Smoke Test Task

## Goal

Validate the v7 unpacked extension in an isolated Chrome Dev profile without touching daily browser profile or production GitHub repos.

## Minimal sequence

1. Start Local Bridge with project-local root.
2. Load unpacked extension from `openpatch-main/` into a dedicated Chrome Dev profile.
3. Configure extension with bridge enabled and bridgeHandlesUpload enabled.
4. Open one ChatGPT page with a harmless zip attachment.
5. Verify inline button appears and has visible badge.
6. Query page event `openpatch:api:get-buttons` and confirm marker schema is v7.
7. Trigger upload in dry-run repo alias.
8. Query bridge compact summary and receipt.

## Evidence to return

- `bridge /health` JSON
- `openpatch:api:get-buttons` JSON summary, no screenshots required
- `compact-summary` JSON
- `receipt` JSON
- console error summary

## Stop conditions

- Any token/cookie/profile path is printed in console or receipt.
- Button marker lacks project/repo/key/mode/status fields.
- Upload triggers direct patch apply workflow.
