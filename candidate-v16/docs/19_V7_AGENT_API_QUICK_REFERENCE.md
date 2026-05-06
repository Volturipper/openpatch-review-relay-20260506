# v7 Agent API Quick Reference

## Page events

- `openpatch:api:get-buttons` → `openpatch:api:buttons`
- `openpatch:api:get-runtime-status` → `openpatch:api:runtime-status`
- `openpatch:api:get-agent-summary` → `openpatch:api:agent-summary`
- `openpatch:api:get-compact-summary` → `openpatch:api:compact-summary`
- `openpatch:api:get-roundpack-prompt` → `openpatch:api:roundpack-prompt`
- `openpatch:api:trigger-upload` → `openpatch:api:trigger-upload-result`
- `openpatch:api:resolve-route` → `openpatch:api:resolve-route-result`

## Local Bridge endpoints

- `GET /health`
- `GET /agent/compact-summary?project=<project>`
- `GET /agent/summary?project=<project>`
- `GET /latest?project=<project>`
- `GET /receipt?project=<project>&round=<round_id>`
- `GET /receipts/recent?project=<project>&limit=20`
- `GET /queue/stats?project=<project>`
- `POST /queue/claim-batch`
- `POST /queue/release`
- `POST /archive/base64`

## Codex CLI examples

```text
node local-bridge/openpatch-ledger-cli.mjs compact-summary --project webai-transfer
node local-bridge/openpatch-ledger-cli.mjs receipts-recent --project webai-transfer --limit 5
node local-bridge/openpatch-ledger-cli.mjs queue-stats --project webai-transfer
node local-bridge/openpatch-ledger-cli.mjs queue-claim-batch --project webai-transfer --max 3 --agent codex
```

## Button marker additions

`data-openpatch-ui-badge`, `data-openpatch-compact-status`, and visible `.openpatch-status-badge` are now present for other scripts and human operators.
