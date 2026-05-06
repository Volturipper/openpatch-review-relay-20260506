# v5 Agent API Quick Reference

## Local Bridge

```text
GET  /health
GET  /config-status
GET  /routes
GET  /repos
GET  /keys
POST /resolve-route
POST /archive/base64
GET  /latest?project=<project>
GET  /status
GET  /queue/status
GET  /sha-index
POST /receipts
```

## `POST /archive/base64`

Purpose: archive a RoundPack or artifact using local repo/key aliases.

Input shape:

```json
{
  "project": "webai-transfer",
  "round_id": "r001",
  "file_name": "webai-roundpack.zip",
  "content_base64": "...",
  "repo_alias": "webai-round-ledger",
  "key_alias": "gh-webai-ledger",
  "dry_run": false
}
```

Output shape:

```json
{
  "ok": true,
  "status": "uploaded | dry_run_planned",
  "mode": "bridge_archive_base64",
  "project": "webai-transfer",
  "round_id": "r001",
  "file_sha256": "...",
  "paths": {
    "archive_path": "...",
    "manifest_path": "...",
    "receipt_path": "...",
    "latest_path": "..."
  },
  "receipt": {},
  "latest": {}
}
```

## Codex CLI

```text
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs config-status
node local-bridge/openpatch-ledger-cli.mjs archive-base64 --project demo --round r001 --file webai-roundpack.zip --dry-run
node local-bridge/openpatch-ledger-cli.mjs latest --project demo
```

## Key point

Codex can quickly query/trigger/inspect the workflow through short JSON APIs. Raw API keys remain local and are never printed by status endpoints.
