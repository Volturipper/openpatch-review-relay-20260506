# Multi-context Failure Modes and Prevention

## Risks

⚠️ Wrong repo/key/profile route.
⚠️ Two browsers update the same latest index concurrently.
⚠️ Stale button from old assistant message gets triggered.
⚠️ Duplicate attachments uploaded many times.
⚠️ Page performance degrades if marker JSON is too large.
⚠️ Agent misreads UI text rather than structured marker.

## v3 mitigations

✅ Button-level route context and IDs.
✅ Button staleness field.
✅ SHA256 receipt for archived file.
✅ Latest index per project instead of one global latest.
✅ Small marker data only; no file content in marker.

## Remaining v4/v5 mitigations

⬜ Bridge-managed upload queue.
⬜ Optimistic-lock retry for GitHub latest update.
⬜ Duplicate SHA index.
⬜ Visible route badge and route mismatch warning.
⬜ Agent-safe CLI status summaries.
