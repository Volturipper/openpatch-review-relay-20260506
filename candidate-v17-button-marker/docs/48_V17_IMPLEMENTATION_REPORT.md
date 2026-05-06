# OpenPatch RE v17 Implementation Report

## Scope

OpenPatch RE v17 is the next candidate after round-1 review. It targets bridge-only dry-run and Chrome/CDP observe-only controlled smoke readiness. It does not claim real GitHub upload/apply, production install, or live Auto Continue install success.

## Required reviewer fixes addressed

✅ Hard route/asset classifier added in `openpatch-main/src/utils.js` and mirrored in `openpatch-main/src/content-script.js`.

✅ Unknown `.zip` defaults to `asset_kind=unknown_zip`, `route_decision=unknown_blocked`, `allowed_action=none`, `can_upload=false`.

✅ UI marker now exposes `asset_kind`, `route_decision`, `route_decision_reason`, `allowed_action`, and `not_approval`.

✅ Archive/review/candidate/evidence assets set `not_approval=true`.

✅ `preflightBundle` blocker logic now checks `readiness.go_no_go` and `config_lint.errors`.

✅ `githubUploadGate` now uses `route.route_context.repo_alias/key_alias` and rejects ambiguous route context.

✅ `resolveArchiveTarget` rejects ambiguous route context before archive.

✅ Smoke plan stale V11/V15 references updated to V17 files and `openpatch.agent_button.v17`.

✅ `codexBrief.next_command` now points back to preflight when blockers exist.

✅ Regression fixtures added for candidate zip, review result zip, `changed-files.zip`, `webai-roundpack.zip`, unknown zip, ambiguous routes, missing aliases, and bad config preflight.

✅ Compact contract added: `docs/openpatch-agent-gateway-contract-v17.md`.

✅ Auto Continue heartbeat contract added in schema and adapter handoff: `schemas/openpatch.auto_continue_heartbeat.v17.schema.json` and `auto-continue-integration/AUTO_CONTINUE_LIVE_ADAPTER_V17.md`.

✅ GitHub-hosted assets are documented as hosted evidence only, not approval/install/merge/release.

## Exact files changed from v16

- `openpatch-main/src/utils.js`
- `openpatch-main/src/content-script.js`
- `openpatch-main/test/utils.test.js`
- `local-bridge/openpatch-local-bridge.mjs`
- `schemas/openpatch.asset_classifier.v17.schema.json`
- `schemas/openpatch.agent_button.v17.schema.json`
- `schemas/openpatch.auto_continue_heartbeat.v17.schema.json`
- `docs/openpatch-agent-gateway-contract-v17.md`
- `docs/48_V17_IMPLEMENTATION_REPORT.md`
- `docs/49_V17_AGENT_API_QUICK_REFERENCE.md`
- `docs/50_V17_REVIEWER_FIX_CLOSURE.md`
- `checks/V17_REGRESSION_FIXTURES.json`
- `checks/V17_CLASSIFIER_FIXTURE_RESULTS.json`
- `checks/SELF_TEST_REPORT_V17.md`
- `task_cards/FOR_CODEX_MINIMAL_V17.md`
- `task_cards/FOR_GITHUB_TEST_UPLOAD_V17.md`
- `browser-smoke/CHROME_DEV_PROFILE_SMOKE_TEST_V17.md`
- `auto-continue-integration/AUTO_CONTINUE_LIVE_ADAPTER_V17.md`
- `audit_decision.json`
- `SHA256SUMS.txt`

## Known gaps

- No real GitHub upload was performed in this candidate generation.
- No production install was performed.
- No live Auto Continue adapter install was performed.
- Chrome Dev profile smoke remains a next controlled observe-only action.

## Recommended next action

Repo/relay reviewer audit of v17 first, then Codex bridge-only dry-run + Chrome/CDP observe-only if reviewer accepts the v17 fixes.
