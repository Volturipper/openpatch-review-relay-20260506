# OPENPATCH Agent Gateway v16 Candidate

本包是 v16 候选版，重点是给 Codex / Auto Continue / 其他 agent 提供更短、更方便的控制与反馈入口。

## 本轮新增

✅ `/codex/brief` 低 token 决策摘要。
✅ `/operation/brief` 综合操作摘要。
✅ `/smoke/bridge-only/run` 一键 bridge-only smoke runner。
✅ CLI：`codex-brief`、`operation-brief`、`bridge-smoke-run`。
✅ 插件 marker 升级到 `openpatch.agent_button.v16`。

## 当前状态

✅ 可交给 Codex 做 bridge-only smoke。
⚠️ 不是生产安装版。
⬜ 未做真实 Chrome Dev profile 安装测试。
⬜ 未做真实 GitHub fine-grained PAT 上传测试。
⬜ 未接入 live Auto Continue 脚本实测。

## 最短入口

```text
node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project openpatch-smoke
```



## v16 continuation summary

Added next-hop handoff APIs for Codex-friendly progression after bridge-only smoke: `/smoke/next-hop`, `/chrome/smoke-handoff`, `/github/test-upload-handoff`, `/auto-continue/live-handoff`, and `/smoke/evidence-pack`. These are designed to keep Codex moving with short machine-readable commands and evidence templates instead of long documents.
