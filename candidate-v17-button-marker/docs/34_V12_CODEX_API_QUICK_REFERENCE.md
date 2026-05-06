# v12 Codex API Quick Reference

## 最短查询

```text
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs readiness --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs codex-handoff --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs evidence-template --project openpatch-smoke --target bridge-only
```

## 新增 HTTP API

```text
POST /readiness
POST /codex/handoff
POST /smoke/evidence-template
POST /instances/prune-stale
```

## 设计意图

- `/readiness`：让 Codex 快速判断是否能继续 smoke。
- `/codex/handoff`：让 Codex 不读长文档也能知道任务、命令、证据和停止点。
- `/smoke/evidence-template`：让 Codex 按固定 JSON 回传证据。
- `/instances/prune-stale`：多页面/多浏览器长跑时清掉旧实例，降低误判。

## 状态语义

```text
go            可以继续
go_with_warnings 可以继续，但要带 warning 证据
no_go         先修 blocking 项
```

## 注意

v12 不是为了限制 Codex，而是让 Codex 更快：先问 readiness，再拿 codex-handoff，再执行 smoke，再按 evidence-template 回传。
