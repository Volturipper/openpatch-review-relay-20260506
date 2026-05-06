# FOR_CODEX_MINIMAL_V4

任务：验证 OPENPATCH Agent Gateway v4 的本地 bridge 与 CLI。

允许：
✅ 在项目内临时目录启动 `node local-bridge/openpatch-local-bridge.mjs`。  
✅ 用 `openpatch-ledger-cli.mjs health/routes/resolve/latest/queue` 查询。  
✅ POST mock receipt，检查 latest 与 sha-index。  
✅ 回传命令、JSON 摘要、失败项。  

输出：
- `bridge_health.json`
- `route_resolve_result.json`
- `mock_receipt_result.json`
- `latest_result.json`
- `sha_index_result.json`
- 简短结论

停止条件：
- CLI 无法启动
- bridge 返回非 JSON
- latest/sha-index 写入失败
