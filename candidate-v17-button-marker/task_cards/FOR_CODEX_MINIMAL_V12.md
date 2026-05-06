# FOR_CODEX_MINIMAL_V12

## 任务

运行 OPENPATCH Agent Gateway v12 的 bridge-only smoke，回传 JSON 证据。

## 范围

✅ 只运行本地 bridge dry-run。  
✅ 可使用 CLI 查询 readiness、handoff、evidence-template。  
✅ 可写项目内 scratch/evidence 文件。  
⬜ 不安装浏览器插件。  
⬜ 不接真实 GitHub token。  
⬜ 不上传真实仓库。

## 建议命令

```text
node local-bridge/openpatch-local-bridge.mjs
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs config-lint
node local-bridge/openpatch-ledger-cli.mjs readiness --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs codex-handoff --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs evidence-template --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs archive-base64 --project openpatch-smoke --round smoke-001 --file webai-roundpack.zip --content-base64 ZHVtbXk= --dry-run
```

## 交付

回传：

```text
health.json
config_lint.json
readiness.json
codex_handoff.json
evidence_template.json
archive_dry_run.json
OPENPATCH_V12_BRIDGE_ONLY_EVIDENCE_SUMMARY.md
```

## 停止条件

⚠️ CLI 输出 token/key 明文。  
⚠️ config-lint 有 error。  
⚠️ readiness 为 no_go。  
⚠️ 任何步骤要求真实 GitHub token 或真实上传。
