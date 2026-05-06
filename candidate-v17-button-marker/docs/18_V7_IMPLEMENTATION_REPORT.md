# OPENPATCH Agent Gateway v7 Implementation Report

## 本轮目标

把 v6 的 agent 控制接入继续推进到真实多页面/多浏览器使用前更稳的状态：UI badge、紧凑 API、队列租约、批量 claim、recent receipt、并发 dry-run 压测、Auto Continue adapter 候选、Chrome Dev smoke test 任务包。

## 本轮新增

✅ 按钮 marker 升级到 `openpatch.agent_button.v7`  
✅ 每个按钮显示 compact status badge：ARCHIVE / PATCH / BUSY / DONE / FAIL / STALE  
✅ 新增页面事件：`openpatch:api:get-compact-summary`  
✅ 新增 background bridge 调用：`GET_OPENPATCH_COMPACT_SUMMARY`  
✅ Local Bridge 新增 `/agent/compact-summary`  
✅ Local Bridge 新增 `/receipts/recent`  
✅ Local Bridge 新增 `/queue/stats`  
✅ Local Bridge 新增 `/queue/claim-batch` 和 `/queue/release`  
✅ Queue claim 增加 lease_until，支持过期 reclaim  
✅ Codex CLI 增加 compact-summary / receipts-recent / queue-stats / queue-claim-batch / queue-release  
✅ 新增 Auto Continue bridge adapter 候选  
✅ 新增并发 dry-run archive 压测脚本  
✅ npm test、npm run check、bridge smoke、parallel archive smoke 均通过

## 设计意图

v7 不把前端页面变成重后端，也不把 Auto Continue 和 OpenPatch 硬合并。插件仍负责页面发现、marker、按钮、事件；Local Bridge 负责 key/repo/queue/receipt/latest；Codex 和其他 agent 通过短 API 查询和触发动作。

## 当前不确定项

⚠️ 尚未做真实 Chrome Dev profile 安装测试。  
⚠️ 尚未做真实 GitHub fine-grained PAT 上传测试。  
⚠️ 尚未基于用户当前最新 ChatGPT Auto Continue 脚本做精确补丁，只提供 adapter 候选。  
⚠️ 多浏览器长期运行、真实网络抖动、GitHub API rate limit 还需要实测。

## 推荐下一轮

1. 在 Chrome Dev 专用 profile 里加载 unpacked v7 插件做页面 marker smoke。  
2. 用单仓 fine-grained PAT + 测试 archive repo 做真实上传 smoke。  
3. 把 `auto-continue-integration/roundpack_scheduler_adapter.js` 接进当前 Auto Continue 脚本。  
4. 做 30-100 轮多页面模拟与 receipt/latest 稳定性测试。  
5. 补 GitHub API rate-limit/backoff 与 bridge event compaction。
