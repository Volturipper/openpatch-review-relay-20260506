# FOR CODEX - Minimal V15 Task

任务：在隔离目录中运行 OPENPATCH Agent Gateway v15 的 bridge-only smoke，不安装浏览器插件，不使用真实 GitHub token，不接真实仓库。

默认命令：

```text
node local-bridge/openpatch-local-bridge.mjs
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs codex-brief --project openpatch-smoke
node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project openpatch-smoke
node local-bridge/openpatch-ledger-cli.mjs operation-brief --project openpatch-smoke --intent continue
```

输出：

```text
health.json
codex_brief.json
bridge_smoke_run.json
operation_brief.json
codex_bridge_smoke_return.json
```

允许：

✅ 本地 bridge-only dry-run。  
✅ 读取 sanitized config/status/result。  
✅ 生成 evidence JSON。  

不要：

⚠️ 不使用真实 token。  
⚠️ 不安装到真实浏览器 profile。  
⚠️ 不做真实 GitHub 上传。
