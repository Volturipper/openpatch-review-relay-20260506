# OPENPATCH Agent Gateway v6 Implementation Report

## 本轮目标

把 v5 的本地 key/repo alias + bridge upload proxy，继续推进为更适合多页面、多浏览器、多组 Web AI 对话的 agent gateway：让 Auto Continue、Codex、其他脚本能用更短 API 判断状态、触发归档、读取反馈、领取/重试队列任务。

## 我的角色

Web AI 设计者辅助者 / 候选实现打包者。此包是候选版本，方便后续本地 Codex、其他 Web AI 或外部审查者继续验证和迭代；不是最终生产放行声明。

## 本轮实际改动

✅ 插件按钮 marker 升级到 `openpatch.agent_button.v6`，新增 `recommendedAgentAction`、`targetSummary`、`bridgeStatusHint`、`queueStatusHint` 等 agent 决策字段。  
✅ 新增页面事件 API：`openpatch:api:get-roundpack-prompt`，Auto Continue 可按需获取内置 RoundPack prompt。  
✅ 新增页面事件 API：`openpatch:api:get-agent-summary`，页面脚本可从 bridge 获取 compact summary。  
✅ RoundPack prompt 增强，要求输出 `[ROUND_PACK_READY]` marker，便于 Auto Continue 判断何时暂停/归档/继续。  
✅ 上传成功/失败 marker 现在带更明确的下一步动作建议，方便 agent 决策。  
✅ Background 增加 bridge latest / queue / agent-summary 查询消息。  
✅ Local Bridge 增加 `/agent/summary`、`/receipt`、`/events`、`/auto-continue/plan`、`/queue/claim`、`/queue/retry`。  
✅ Codex CLI 增加 `agent-summary`、`receipt`、`events`、`queue-claim`、`queue-retry`、`auto-continue-plan`。  
✅ Bridge 增加轻量 event log，便于多页面/多浏览器问题排查。  
✅ 完成 npm 与 local bridge smoke tests。

## 完成状态

✅ 保留 v5 bridge-side GitHub upload proxy。  
✅ 保留 dry-run archive 自测路径。  
✅ 支持 Codex 更主动地查、取、认领、重试、规划下一步。  
✅ 不把代码明文塞进聊天；完整 diff 和自检报告在包内。  
⬜ 未做真实 Chrome Dev profile 安装测试。  
⬜ 未做真实 GitHub token 上传测试。  
⬜ 未做多浏览器长期压力测试。  
⬜ 未做 UI 可视化 polish。

## 不放行限制

⚠️ v6 仍是候选包。  
⚠️ 真实 key、真实 repo、真实浏览器 profile、真实多页面上传前，仍建议先做 isolated smoke test。  
⚠️ 此包没有声明可直接覆盖现有生产插件。  
⚠️ 归档入库不等于批准执行、合并、apply 或改真实项目。

## 下一步任务

1. 在隔离 Chrome Dev profile 做真实插件加载 smoke test。  
2. 用 fine-grained PAT + 专用测试仓做一次真实 archive upload。  
3. 让 Auto Continue 使用 `openpatch:api:get-roundpack-prompt` 和 `[ROUND_PACK_READY]` marker。  
4. 用 Codex CLI 连续跑：`agent-summary` → `auto-continue-plan` → `archive-base64 --dry-run` → `receipt`。  
5. 做多页面并发模拟，验证 queue claim/retry、latest、sha-index 不互相覆盖。
