# FOR_CODEX_MINIMAL_V9

任务：只读/本地 smoke OPENPATCH Agent Gateway v9。

默认可做：
✅ 启动 local bridge。  
✅ 查询 health、routes-conflicts、compact-summary。  
✅ 运行 dry-run stress archive。  
✅ 回传 JSON 证据、命令、退出码、失败摘要。

优先命令：

```text
node local-bridge/openpatch-local-bridge.mjs
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs routes-conflicts
node local-bridge/openpatch-ledger-cli.mjs stress-archive --project v9-smoke --count 300 --parallel 20
```

输出：
`evidence/openpatch_v9_smoke_result.json`，包含 health/routes_conflicts/stress_summary/exit_codes。
