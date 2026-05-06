# OpenPatch Agent Gateway v16 - Independent Review Round 1

## Verdict

`ready_for_controlled_smoke`

Scope-limited meaning: v16 may proceed to controlled smoke for bridge-only dry-run and Chrome/CDP observe-only checks. It is not approved for production install, real GitHub upload, apply route, or Auto Continue live installation.

## Inputs reviewed

- Candidate zip: `openpatch_agent_gateway_v16_candidate.zip`
- Expected SHA256: `d7cfcf2a5099498bc9d8003569212da5551558c0b5c4601ff175efde600ae699`
- Actual SHA256: `d7cfcf2a5099498bc9d8003569212da5551558c0b5c4601ff175efde600ae699`
- SHA256 match: `true`
- Read order completed:
  - `README.md`
  - `docs/45_V16_IMPLEMENTATION_REPORT.md`
  - `docs/46_V16_AGENT_API_QUICK_REFERENCE.md`
  - `docs/47_V16_NEXT_HOP_SMOKE_CHAIN.md`
  - `checks/SELF_TEST_REPORT_V16.md`
  - `browser-smoke/CHROME_DEV_PROFILE_SMOKE_TEST_V16.md`
  - `docs/44_V15_CODEX_BRIDGE_SMOKE_PATH.md`
  - `docs/41_V14_PREFLIGHT_GATE_AND_SMOKE_PATH.md`

## What passed

- Attachment SHA256 matched expected.
- Internal SHA256SUMS.txt verified 376/376 entries.
- Zip path scan found no unsafe absolute/../ paths and no symlinks; two executable bits on CLI .mjs files only.
- Secret-pattern scan found no PAT/OpenAI/private-key/cookie assignment pattern values.
- openpatch-main npm test passed: 14/14.
- openpatch-main npm run check passed and manifest parsed.
- node --check passed for local bridge, ledger CLI, and Auto Continue v9 adapter.
- Controlled local bridge smoke passed in isolated root on port 17874 with dry_run_planned receipt and no token.

## Top risks

### R1 P0 - Generic .zip route confusion can send archives to apply route.\n\nThe UI/classifier treats any .zip as patch-capable and only switches to archive by text heuristics. In sandbox classifier probes, changed-files.zip => patch_upload as expected, but openpatch_agent_gateway_v16_candidate.zip, openpatch_review_round_1_result.zip, and candidate.zip also resolve to patch_upload in auto mode. This is unsafe because candidate/review/evidence zips may contain .github/workflows or non-apply archive material.\n\nRequired change: Add a hard asset_kind classifier: changed_files_apply, diff_apply, roundpack_archive_only, review_evidence_only, smoke_evidence_only, unknown_blocked. Default unknown .zip to blocked, not patch_upload. Only exact changed-files.zip or explicit apply manifest may enter apply route.\n
### R2 P0 - preflight can report go while readiness/config are no_go.\n\npreflightBundle checks readiness.status and config.blockers, but readinessReport returns go_no_go and configLint returns errors. With injected bad route aliases, preflight --target bridge-only returned result=go and blockers=[] while readiness.ok=false/go_no_go=no_go and config_lint.ok=false.\n\nRequired change: Use readiness.go_no_go === 'no_go' and config_lint.errors.length > 0 as blockers for every target. Add a regression fixture where config_lint has errors and preflight must be no_go.\n
### R3 P1 - GitHub test upload handoff cannot inherit resolved route aliases.\n\ngithubUploadGate reads route.selected?.repo_alias/key_alias, but resolveRoute returns route_context, not selected. Without explicit CLI aliases, gate reports repo_alias_missing/key_alias_missing even when route_context could provide them.\n\nRequired change: Read route.route_context.repo_alias and route.route_context.key_alias. Add a positive fixture with a matching route profile that produces can_upload=true only for an owner-approved test repo/key route.\n
### R4 P1 - Some smoke-plan strings are stale.\n\nsmokePlan still references V11 docs and expects marker v15, while v16 marker is openpatch.agent_button.v16. This can waste Codex tokens and cause false failures.\n\nRequired change: Update smoke-plan docs/commands/expectations to v16 and make marker expectation exact.\n
### R5 P1 - Codex brief can recommend a bridge-smoke command even when action_now says fix blockers.\n\nIn bad config tests, codexBrief action_now=fix_preflight_blockers but next_command still points to bridge-smoke-run. This creates mixed guidance.\n\nRequired change: When blockers exist, next_command must be config-lint/routes-fix-suggestions/readiness, not smoke execution.\n
### R6 P1 - Auto Continue integration is still contract-level, not live verified.\n\nv16 provides signal/handoff surfaces, but candidate explicitly says no live Auto Continue script test. Blind waiting remains prohibited.\n\nRequired change: Add heartbeat states and stale thresholds to a machine-readable contract: waiting, generating, done, stalled, error, receipt_missing.\n

## Decision

Continue to controlled smoke only under these limits:

- bridge-only local dry-run smoke
- Chrome Dev/CDP observe-only marker/API smoke in isolated test profile
- Local Bridge state/receipt/latest/queue readback
- Auto Continue signal/heartbeat observation only

Do not approve:

- local merge/install as production extension
- real GitHub upload or apply route
- clicking OpenPatch upload/archive buttons in live pages without owner action-time approval
- using real PAT/cookies/browser profile/.env
- Auto Continue live adapter install or blind waiting automation
- treating GitHub-hosted assets as merge targets

## Reviewer note

This review treats GitHub as hosted evidence/artifact storage only. A GitHub upload or hosted candidate zip is not a local merge, install, production readiness, or owner approval.
