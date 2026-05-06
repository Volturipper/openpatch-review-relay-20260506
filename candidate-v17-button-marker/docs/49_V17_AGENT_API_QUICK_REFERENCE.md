# OpenPatch RE v17 Agent API Quick Reference

## Page marker

Agent-visible marker version: `openpatch.agent_button.v17`.

Required high-signal fields:

```text
asset_kind
route_decision
route_decision_reason
allowed_action
not_approval
status
recommendedAgentAction
routeContext.project / repoAlias / keyAlias / routeProfile
```

## Local bridge checks

```text
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs preflight --project <project> --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs codex-brief --project <project> --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project <project>
node local-bridge/openpatch-ledger-cli.mjs github-upload-gate --project <project> --url <page_url> --title <title>
```

## Expected blocker behavior

- `unknown_zip` -> blocked, no upload.
- ambiguous route context -> blocked for real upload/archive.
- config lint errors -> preflight `no_go`.
- receipt missing after archive marker -> Auto Continue must pause.

## Evidence only

GitHub-hosted receipts, latest JSON, workflow logs, or review zips are evidence only. They do not approve merge/install/upload/apply.
