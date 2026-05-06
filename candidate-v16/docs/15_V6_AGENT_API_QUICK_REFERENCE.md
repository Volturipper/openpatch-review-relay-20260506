# v6 Agent API Quick Reference

## Page Event API

用于 Auto Continue / 页面脚本，不暴露 token。

```text
openpatch:api:get-buttons              -> openpatch:api:buttons
openpatch:api:get-runtime-status       -> openpatch:api:runtime-status
openpatch:api:set-route-context        -> openpatch:agent-status
openpatch:api:resolve-route            -> openpatch:api:resolve-route-result
openpatch:api:get-bridge-status        -> openpatch:api:bridge-status
openpatch:api:get-roundpack-prompt     -> openpatch:api:roundpack-prompt
openpatch:api:get-agent-summary        -> openpatch:api:agent-summary
openpatch:api:request-archive          -> openpatch:api:archive-requested
openpatch:api:trigger-upload           -> openpatch:api:trigger-upload-result
openpatch:agent-status                 -> status event stream
```

## Button marker v6

每个按钮作为 agent 可读状态节点，核心字段：

```text
schemaVersion = openpatch.agent_button.v6
status
mode
action
fileName
buttonId
pageSessionId
routeContext.project
routeContext.repoAlias
routeContext.keyAlias
stalenessStatus
recommendedAgentAction
targetSummary
bridgeStatusHint
queueStatusHint
result
error
```

## Local Bridge API

```text
GET  /health
GET  /config-status
GET  /routes
GET  /repos
GET  /keys
GET  /status
GET  /latest?project=<project>
GET  /agent/summary?project=<project>
GET  /receipt?project=<project>&round=<round_id>
GET  /events?limit=<n>
GET  /queue/status
GET  /sha-index
POST /resolve-route
POST /archive/base64
POST /receipts
POST /queue/enqueue
POST /queue/claim
POST /queue/retry
POST /queue/complete
POST /queue/fail
POST /auto-continue/plan
```

## Codex CLI

```text
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs config-status
node local-bridge/openpatch-ledger-cli.mjs agent-summary --project webai-transfer
node local-bridge/openpatch-ledger-cli.mjs latest --project webai-transfer
node local-bridge/openpatch-ledger-cli.mjs receipt --project webai-transfer --round <round_id>
node local-bridge/openpatch-ledger-cli.mjs events --limit 20
node local-bridge/openpatch-ledger-cli.mjs queue
node local-bridge/openpatch-ledger-cli.mjs queue-claim --project webai-transfer --agent codex
node local-bridge/openpatch-ledger-cli.mjs queue-retry --project webai-transfer --round <round_id>
node local-bridge/openpatch-ledger-cli.mjs auto-continue-plan --project webai-transfer --message-count 5 --interval 5
node local-bridge/openpatch-ledger-cli.mjs archive-base64 --project webai-transfer --round smoke --file webai-roundpack.zip --dry-run
```

## 建议默认读取顺序

Codex 默认只读：

```text
agent-summary
latest
receipt
NEXT_FOR_CODEX.md / ROUND_SUMMARY.md（从 roundpack 解包后）
```

不要默认读完整 transcript，除非任务需要。
