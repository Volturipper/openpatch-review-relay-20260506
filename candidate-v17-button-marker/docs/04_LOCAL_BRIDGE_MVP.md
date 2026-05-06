# Local Bridge MVP

## Current v3 bridge

Included file:

```text
local-bridge/openpatch-local-bridge.mjs
```

Supported endpoints:

```text
GET  /health
GET  /routes
GET  /status
POST /receipts
```

## Purpose

Give Codex and other agents a stable local status/receipt interface without requiring them to inspect the browser page.

## Next bridge additions

⬜ `GET /profiles/:id`
⬜ `POST /resolve-route`
⬜ `POST /archive-request`
⬜ `GET /latest/:project`
⬜ `POST /retry/:round_id`
⬜ Queue lock for concurrent uploads.
⬜ Key alias resolution from local environment or key store.

## Key handling principle

Keys can exist locally for private use, but agents should normally see aliases and status, not printed secret values.
