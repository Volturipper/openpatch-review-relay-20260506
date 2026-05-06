# Minimal Controlled Smoke Plan - Round 1

Verdict scope: `ready_for_controlled_smoke`, but only for dry-run and observe-only checks.

## 1. verify_attachment_and_paths\n\nActor: Codex\n\nCommand/scope: `sha256 check + zip path list only`\n\nPass: sha256 matches expected; no absolute paths, ../, symlinks, secrets, or unexpected executable files\n\nStop: hash mismatch or unsafe path\n
## 2. bridge_only_dry_run\n\nActor: Codex\n\nCommand/scope: `node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project openpatch-smoke`\n\nPass: schema_version=openpatch.bridge_smoke_evidence.v16; pass=true; dry_run_planned; no token output\n\nStop: pass=false, config_lint errors, readiness no_go, or token-like output\n
## 3. contract_readback\n\nActor: Codex\n\nCommand/scope: `codex-brief, operation-brief, next-hop, evidence-pack`\n\nPass: short JSON is parseable and does not contradict bridge_smoke result\n\nStop: preflight says go while readiness/config is no_go\n
## 4. chrome_dev_observe_only\n\nActor: Codex with owner action-time approval\n\nCommand/scope: `dedicated Chrome Dev profile; load unpacked extension; CDP read DOM/event markers only`\n\nPass: data-openpatch-marker=openpatch.agent_button.v16; get-buttons/runtime-status/bridge-status respond; no upload triggered\n\nStop: extension runtime error, marker absent, stale marker, routeConflictHint blocking/ambiguous, or any request to click upload\n
## 5. auto_continue_signal_observe_only\n\nActor: Codex or reviewer\n\nCommand/scope: `observe heartbeat/signal contract only`\n\nPass: state is explicit: waiting/generating/done/stalled/error/receipt_missing\n\nStop: blind waiting or missing heartbeat\n
## 6. evidence_return\n\nActor: Codex\n\nCommand/scope: `write ASCII evidence JSON/txt only`\n\nPass: evidence includes commands, outputs, stop decisions, marker sample, no secrets\n\nStop: screenshot-only evidence or secret-bearing output\n

## Required evidence file names

- `openpatch-v16-bridge-smoke-result.json`
- `openpatch-v16-cdp-marker-sample.json`
- `openpatch-v16-page-event-results.json`
- `openpatch-v16-console-error-summary.txt`
- `openpatch-v16-smoke-go-no-go.json`

## Absolute stop conditions

- Any token/cookie/.env/PAT value appears in output.
- Any request to click upload/archive on a real page before owner action-time approval.
- Any route classification result is `unknown`, `ambiguous`, or `patch_upload` for a non-`changed-files.zip` archive.
- `preflight` says `go` while `readiness.go_no_go` is `no_go` or `config_lint.ok=false`.
