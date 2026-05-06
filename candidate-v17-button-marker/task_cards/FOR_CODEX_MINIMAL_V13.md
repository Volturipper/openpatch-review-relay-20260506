# FOR_CODEX_MINIMAL_V13

Task: run bridge-only v13 smoke and return JSON evidence.

Allowed actions:
- run local bridge in a project-local scratch directory
- call CLI commands listed below
- create evidence JSON files
- do dry-run archive only

Commands:

```text
node local-bridge/openpatch-local-bridge.mjs
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs config-lint
node local-bridge/openpatch-ledger-cli.mjs config-snapshot
node local-bridge/openpatch-ledger-cli.mjs projects
node local-bridge/openpatch-ledger-cli.mjs readiness --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs next-action --project openpatch-smoke --target bridge-only --message-count 12
node local-bridge/openpatch-ledger-cli.mjs archive-base64 --project openpatch-smoke --round v13-smoke --file webai-roundpack.zip --content-base64 ZHVtbXk= --dry-run
node local-bridge/openpatch-ledger-cli.mjs next-action --project openpatch-smoke --target bridge-only --message-count 12
```

Return:

```text
health.json
config_lint.json
config_snapshot.json
projects.json
readiness.json
next_action_before.json
archive_dry_run.json
next_action_after.json
go_no_go_summary.json
```

Stop if:
- bridge fails to start
- CLI prints raw token material
- config-lint has errors that are not expected fixture errors
- any command writes outside the selected scratch directory
