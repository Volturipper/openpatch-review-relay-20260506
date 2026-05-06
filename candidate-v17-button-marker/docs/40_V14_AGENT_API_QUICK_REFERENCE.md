# v14 Agent API Quick Reference

## Local Bridge endpoints

### `POST /preflight`

Compact bundle for Codex before doing a smoke test.

Input:

```json
{
  "project": "openpatch-smoke",
  "target": "bridge-only",
  "message_count": 7
}
```

Returns:

- `result`: `go`, `go_with_warnings`, or `no_go`
- `blockers`
- `recommended_agent_action`
- `codex_handoff`
- `evidence_template`
- `config_lint`
- `github_upload_gate`
- `instances_compact`
- `next_action`

### `POST /github/upload-gate`

Checks whether the selected project/page/route can use a repo alias and key alias for real upload.

Returns:

- `gate`: `go`, `go_with_warnings`, or `blocked`
- `can_upload`
- `repo_alias`
- `key_alias`
- `blockers`
- `warnings`

### `POST /auto-continue/preflight`

Used by ChatGPT Auto Continue adapter before it sends another continue message.

Returns:

- `should_pause`
- `should_request_roundpack`
- `recommended_agent_action`
- `compact_summary`
- `route_conflicts`

### `GET /instances/compact`

Low-token summary of active/stale browser/plugin instances.

Returns:

- `active_count`
- `stale_count`
- `by_project`
- `by_route_profile`
- `duplicate_route_groups`
- `recommended_agent_action`

## CLI commands

```bash
node local-bridge/openpatch-ledger-cli.mjs preflight --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs github-upload-gate --project openpatch-smoke
node local-bridge/openpatch-ledger-cli.mjs auto-continue-preflight --project openpatch-smoke --message-count 7
node local-bridge/openpatch-ledger-cli.mjs instances-compact
```

## Recommended Codex flow

```text
1. Run preflight bridge-only.
2. If result is go/go_with_warnings, run bridge-only smoke.
3. If target is GitHub upload, run github-upload-gate first.
4. Only then perform one archive-only test upload with a test repo/key alias.
5. Return evidence JSON.
```
