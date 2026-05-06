# Agent API Quick Reference v4

## 页面事件 API

- `openpatch:api:get-buttons` → `openpatch:api:buttons`
- `openpatch:api:get-runtime-status` → `openpatch:api:runtime-status`
- `openpatch:api:get-bridge-status` → `openpatch:api:bridge-status`
- `openpatch:api:resolve-route` → `openpatch:api:resolve-route-result`
- `openpatch:api:trigger-upload` → `openpatch:api:trigger-upload-result`

## Local Bridge API

- `GET /health`
- `GET /routes`
- `POST /resolve-route`
- `GET /status`
- `GET /latest?project=<project>`
- `GET /sha-index`
- `GET /queue/status`
- `POST /queue/enqueue`
- `POST /queue/complete`
- `POST /queue/fail`
- `POST /receipts`

## Codex CLI

```bash
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs latest --project webai-transfer
node local-bridge/openpatch-ledger-cli.mjs resolve --url "https://chatgpt.com/c/..." --title "webai_transfer designer"
node local-bridge/openpatch-ledger-cli.mjs queue
```

## 便利性原则

Codex 可以直接查询、排队、解析路由、读取 latest、检查重复和回传 evidence。只有真实上传 key、切换真实 repo、merge/apply 等高影响动作需要 owner 明确确认。
