# Agent API Spec v3

## Page event APIs

### Query buttons

```text
request:  openpatch:api:get-buttons
response: openpatch:api:buttons
```

### Set route context

```text
request: openpatch:api:set-route-context
status:  openpatch:agent-status
```

Suggested fields:

```json
{
  "project": "webai-transfer",
  "routeId": "designer-chat-a",
  "routeProfile": "webai-transfer-designer",
  "repoAlias": "github-archive-webai-transfer",
  "keyAlias": "github-pat-archive-only",
  "mode": "archive_only",
  "roundId": "round-001"
}
```

### Trigger existing upload/archive button

```text
request:  openpatch:api:trigger-upload
response: openpatch:api:trigger-upload-result
status:   openpatch:agent-status
```

Example request fields:

```json
{
  "requestId": "auto-continue-r12",
  "buttonId": "..."
}
```

The event only triggers an already-created button; it does not accept arbitrary content from the page.

## GitHub ledger outputs

```text
rounds/<project>/<yyyy>/<mm>/<dd>/<round_id>/<artifact>
rounds/<project>/<yyyy>/<mm>/<dd>/<round_id>/archive_manifest.json
rounds/<project>/<yyyy>/<mm>/<dd>/<round_id>/upload_receipt.json
index/latest/<project>.json
```

## Local bridge APIs

```text
GET  /health
GET  /routes
GET  /status
POST /receipts
```

The bridge is intentionally small in v3. The next step is to add key-alias-backed GitHub upload and queue APIs.
