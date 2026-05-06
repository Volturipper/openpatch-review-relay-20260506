# V9 Agent API Quick Reference

## Codex 常用命令

```text
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs routes-conflicts
node local-bridge/openpatch-ledger-cli.mjs routes-conflicts --url <chat_url> --title <title> --project <project>
node local-bridge/openpatch-ledger-cli.mjs compact-summary --project <project>
node local-bridge/openpatch-ledger-cli.mjs queue-reclaim-expired --project <project>
node local-bridge/openpatch-ledger-cli.mjs stress-archive --project <project> --count 300 --parallel 20
```

## 页面事件 API

```text
openpatch:api:get-route-conflicts
openpatch:api:route-conflicts
```

Agent 读取按钮时重点看：

```text
data-openpatch-project
data-openpatch-repo-alias
data-openpatch-key-alias
data-openpatch-route-conflict-hint
data-openpatch-recommended-agent-action
```

## 决策建议

- `routeConflictHint=clear`：可继续归档。
- `routeConflictHint=warnings`：可由 Codex 记录 warning 后继续。
- `routeConflictHint=ambiguous`：先 set-route-context 或指定 route_profile。
- `routeConflictHint=blocking_conflict`：先修 route_profiles，避免误传仓库/key。
