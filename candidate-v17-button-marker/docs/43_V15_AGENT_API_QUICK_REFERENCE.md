# V15 Agent API Quick Reference

## Codex 最短入口

```text
node local-bridge/openpatch-ledger-cli.mjs codex-brief --project <project>
```

返回：

```text
result
latest_round
latest_status
queue_counts
action_now
next_command
warnings
stop_if
```

## 一键 bridge-only smoke

```text
node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project <project>
```

它会调用 bridge 内部流程：

```text
health
config-lint
readiness
dry-run archive
compact-summary
write evidence JSON
```

输出包含：

```text
pass
blockers
warnings
evidence_path
next_recommended_action
```

## 综合操作摘要

```text
node local-bridge/openpatch-ledger-cli.mjs operation-brief --project <project> --intent continue
```

适合 Auto Continue / Codex / 其他 agent 在继续前快速判断：

```text
should_pause_auto
can_continue_auto
queue_counts
active_instances
stale_instances
recommended_agent_action
command_to_run
```

## HTTP API

```text
POST /codex/brief
POST /operation/brief
POST /smoke/bridge-only/run
```

## 约束说明

这些接口是便利 Codex 行动的控制面，不打印 token，不读 secrets，不触发真实 GitHub 上传，除非调用 archive/upload 相关 API 且 route/key/repo 已配置。
