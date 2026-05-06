# FOR_CODEX_MINIMAL_V6

任务：只读评估 v6 候选包的 agent gateway 能力，不接真实 token，不碰真实仓库。

建议命令：

```text
cd <候选包>/openpatch-main
npm test
npm run check

cd <候选包>/local-bridge
OPENPATCH_BRIDGE_ROOT=<项目内临时目录> OPENPATCH_BRIDGE_PORT=17873 node openpatch-local-bridge.mjs
node openpatch-ledger-cli.mjs health
node openpatch-ledger-cli.mjs agent-summary --project webai-transfer
node openpatch-ledger-cli.mjs auto-continue-plan --project webai-transfer --message-count 5 --interval 5
node openpatch-ledger-cli.mjs archive-base64 --project webai-transfer --round smoke-v6 --file webai-roundpack.zip --dry-run
node openpatch-ledger-cli.mjs receipt --project webai-transfer --round smoke-v6
```

输出：简短结论 + 命令结果摘要 + 失败项 + 生成的 evidence 路径。
