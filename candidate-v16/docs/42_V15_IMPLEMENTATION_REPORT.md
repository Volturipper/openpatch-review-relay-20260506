# OPENPATCH Agent Gateway v15 Implementation Report

## 本轮目标

把 v14 的 preflight / upload-gate / Auto Continue preflight 控制面继续推进成更方便 Codex 与其他 agent 行动的版本：提供更短的决策摘要、一键 bridge-only smoke runner、operation brief，并把结果固化为可查询 evidence。

## 本轮新增

✅ 新增 `/codex/brief`：返回低 token 的 Codex 决策摘要、下一条建议命令、最新 round、队列计数、stop 条件。  
✅ 新增 `/operation/brief`：把 preflight、next-action、auto-continue、实例状态、队列状态压成一个 agent 可读的一页摘要。  
✅ 新增 `/smoke/bridge-only/run`：bridge 内部执行 health / config-lint / readiness / dry-run archive / compact-summary，并写入本地 evidence JSON。  
✅ CLI 新增 `codex-brief`、`operation-brief`、`bridge-smoke-run`。  
✅ 插件 marker 升级到 `openpatch.agent_button.v15`。  
✅ health capabilities 增加 `codex_brief`、`bridge_smoke_run`、`operation_brief`。  
✅ 自测新增 v15 smoke：API 与 CLI 均可调用。

## 设计意图

v15 不限制 Codex；相反，它把 Codex 下一步需要的信息压缩成短 API，让 Codex 少读文档、少猜状态、少翻日志：

```text
Codex -> /codex/brief
      -> 若需要 smoke：/smoke/bridge-only/run
      -> 若已有 latest：读取 receipt/latest
      -> 若需要 Auto Continue：/operation/brief 或 /auto-continue/preflight
```

## 当前仍未完成

⬜ 真实 Chrome Dev profile unpacked extension 安装测试。  
⬜ 真实 GitHub fine-grained PAT 单测试仓 archive-only 上传测试。  
⬜ live Auto Continue 当前脚本接入实测。  
⬜ 多浏览器长期运行真实压测。  

## go/no-go

✅ 可交给 Codex 做 bridge-only smoke。  
⚠️ 仍不是生产安装版。  
⚠️ 真实上传 GitHub 前仍需要单测试仓和 key_alias/repo_alias 配置检查。
