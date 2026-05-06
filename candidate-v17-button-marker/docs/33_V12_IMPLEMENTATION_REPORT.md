# OPENPATCH Agent Gateway v12 Implementation Report

## 本轮目标

把 v11 的真实 smoke 准备进一步压缩成 Codex / 本地 agent 可直接查询的 go/no-go 控制面，减少交接时读长文档和误操作。

## 本轮角色与范围

- 角色：Web AI 设计者辅助者 / 候选实现打包者。
- 范围：候选包内实装与自检；未在用户真实浏览器、真实 GitHub token 或真实仓库运行。
- 目标：便利 Codex 行动，而不是限制 Codex；提供短 API、短 CLI、结构化证据模板和下一步动作。

## 新增能力

✅ 新增 `/readiness`：汇总 config lint、route conflict、instances、queue、latest、rate-limit，返回 `go_no_go`。  
✅ 新增 `/codex/handoff`：给 Codex 返回一行任务、默认命令、证据要求、停止点和 readiness。  
✅ 新增 `/smoke/evidence-template`：返回 smoke evidence 的机器可读模板。  
✅ 新增 `/instances/prune-stale`：清理过期浏览器/页面实例登记，防止多页面长跑后状态污染。  
✅ CLI 新增 `readiness` / `codex-handoff` / `evidence-template` / `instances-prune-stale`。  
✅ content marker schema 升级到 `openpatch.agent_button.v12`。  
✅ health capabilities 增加 readiness/codex/evidence/prune 能力声明。

## 自检结果

✅ `npm test` pass。  
✅ `npm run check` pass。  
✅ `node --check local-bridge/openpatch-local-bridge.mjs` pass。  
✅ `node --check local-bridge/openpatch-ledger-cli.mjs` pass。  
✅ bridge `/health` pass。  
✅ bridge `/readiness` pass。  
✅ bridge `/codex/handoff` pass。  
✅ bridge `/smoke/evidence-template` pass。  
✅ CLI `readiness` / `codex-handoff` / `evidence-template` pass。

## 当前 go/no-go

✅ 可交给 Codex 做 bridge-only smoke。  
⬜ 尚未做 Chrome Dev profile unpacked extension smoke。  
⬜ 尚未做真实 GitHub fine-grained PAT archive-only upload smoke。  
⬜ 尚未接入当前 live ChatGPT Auto Continue 脚本。  
⚠️ 仍是候选包，不是生产安装版。

## 下一步

1. Codex 先运行 `FOR_CODEX_MINIMAL_V12.md` 的 bridge-only smoke。
2. 通过后再做 Chrome Dev profile smoke。
3. 再做单测试仓 fine-grained PAT archive-only 上传。
4. 最后接入 Auto Continue live adapter。
