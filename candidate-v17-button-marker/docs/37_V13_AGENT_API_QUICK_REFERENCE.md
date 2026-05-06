# v13 Agent API Quick Reference

## Purpose
Give Codex / Auto Continue / other agents short, machine-readable control APIs for multi-chat archive workflows.

## New endpoints

### `GET /config/snapshot`
Returns sanitized route/profile/key/repo bindings.

Use it when an agent needs to answer:

```text
Which projects exist?
Which repo_alias does this project route to?
Which key_alias is expected?
Is this repo/key binding allowed by policy?
```

### `GET /projects`
Returns known projects, latest round status, and route bindings.

### `POST /agent/next-action`
Input:

```json
{
  "project": "webai-transfer",
  "target": "bridge-only",
  "message_count": 12
}
```

Output includes:

```text
go_no_go
recommended_agent_action
actions[] with command + reason
compact latest/queue summary
```

## New CLI commands

```text
config-snapshot
projects
next-action --project <project> --target <target> --message-count <n>
```

## Recommended agent flow

```text
1. health
2. config-lint
3. config-snapshot
4. next-action --project <project>
5. If latest exists: receipt/latest
6. If latest missing: auto-continue-plan or request RoundPack
7. If queue has work: queue-stats / queue-claim-batch
```

## Secret handling
No endpoint returns raw token values. v13 exposes token alias, token_env name, and boolean availability only.
