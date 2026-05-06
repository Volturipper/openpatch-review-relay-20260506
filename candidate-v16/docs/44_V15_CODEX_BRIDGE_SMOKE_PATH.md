# V15 Codex Bridge-only Smoke Path

## 目的

让 Codex 用最少步骤确认 Local Bridge 候选是否能作为 agent 控制接入层工作。

## 推荐步骤

```text
1. node local-bridge/openpatch-ledger-cli.mjs health
2. node local-bridge/openpatch-ledger-cli.mjs codex-brief --project openpatch-smoke
3. node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project openpatch-smoke
4. node local-bridge/openpatch-ledger-cli.mjs operation-brief --project openpatch-smoke --intent continue
```

## 期望结果

```text
health.ok = true
codex-brief.ok = true
bridge-smoke-run.pass = true
operation-brief.ok = true
```

## 回传证据

Codex 应回传一个 JSON：

```json
{
  "schema_version": "openpatch.codex_bridge_smoke_return.v15",
  "status": "pass_or_blocked",
  "commands_run": [],
  "evidence_files": [],
  "blockers": [],
  "warnings": [],
  "next_recommended_action": ""
}
```

## 停止条件

⚠️ 如果输出中出现 token/cookie/.env 内容，立即停止。  
⚠️ 如果 config-lint 有 error，先修配置，不做真实上传。  
⚠️ 如果需要真实 GitHub 上传，必须先走单测试仓 fine-grained PAT smoke。
