# Codex Control Workflow

## Capability-first design

Codex should be able to act efficiently:

✅ Read latest/status/result.
✅ Fetch RoundPack or receipt.
✅ Request validation or retry.
✅ Generate next Web AI prompt.
✅ Summarize status for owner.

## Suggested Codex commands after bridge expansion

```text
openpatch status --project webai-transfer
openpatch latest --project webai-transfer
openpatch fetch --round round-001 --only codex
openpatch retry --round round-001
openpatch summarize --round round-001
```

## v3 available now

✅ GitHub latest/receipt file shapes.
✅ Local bridge `/status` and `/receipts` skeleton.
✅ Page event API for trigger/query.

## v4 target

Add a real Codex-facing CLI around the local bridge.
