# OPENPATCH Agent Gateway v4 Implementation Report

## 本轮目标

把 v3 从“可上传/可归档”推进到“多页面、多浏览器、多 key、多仓库场景下可被 agent 查询、调度、去重和恢复”的候选版。

## 完成项

✅ Local Bridge 升级到 v2 health/capabilities。  
✅ 新增 `/resolve-route`，根据 route profiles 从页面 URL/title/project hint 解析 project/repo_alias/key_alias。  
✅ 新增 `/latest?project=...`，Codex 可直接查询最新 round。  
✅ 新增 `/sha-index`，按 project + file_sha256 追踪重复文件。  
✅ 新增 `/queue/enqueue`、`/queue/status`、`/queue/complete`、`/queue/fail`，为多页面并发上传预留队列。  
✅ `/receipts` 升级：写 receipt、latest、status、sha_index，并返回 duplicate hint。  
✅ 新增 `openpatch-ledger-cli.mjs`，Codex 可查 health/routes/status/latest/queue/sha-index/resolve/enqueue。  
✅ 插件 manifest 增加 localhost/127.0.0.1 bridge host permissions。  
✅ 插件上传 RoundPack 后会向本地 bridge 回传 receipt；bridge 失败不阻断 GitHub 上传结果。  
✅ 页面事件 API 新增 `openpatch:api:resolve-route` 与 `openpatch:api:get-bridge-status`。  
✅ Marker 升级为 `openpatch.agent_button.v4`，runtime status 增加 bridgeStatus。  

## 未完成项

⬜ 真实浏览器多实例压力测试。  
⬜ 真实 GitHub fine-grained token 上传测试。  
⬜ bridge 使用本地 key_alias 代替插件 token 的完整上传代理。  
⬜ validate-roundpack workflow 真实运行。  
⬜ 队列尚未真正承接上传执行，只是 agent 调度/状态层。  

## 决策建议

✅ 可以进入下一轮 v5：Local Bridge upload proxy（本地 key_alias 管理 + GitHub 上传由 bridge 执行）。  
⚠️ 当前 v4 仍保留插件内 GitHub token 上传路径；如果你准备把多个 API key 放本地环境，v5 应把上传执行逐步迁移到 bridge。  
❌ 不建议把此候选直接当生产版多浏览器部署。  
