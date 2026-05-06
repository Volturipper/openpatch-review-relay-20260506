# SELF_TEST_REPORT_V17

Date: 2026-05-06
Role: OpenPatch RE designer/source maintainer candidate self-check.

## Scope

Local sandbox checks only. No real GitHub upload, no production install, no live Auto Continue install, no secrets/PAT/cookie/.env access.

## Commands and results

| Check | Result | Evidence |
|---|---:|---|
| `npm test` | ✅ pass, 15/15 | `checks/npm_test_v17.log` |
| `npm run check` | ✅ pass | `checks/npm_run_check_v17.log` |
| `node --check src/content-script.js` | ✅ pass | `checks/content_script_node_check_v17.log` |
| `node --check src/utils.js` | ✅ pass | `checks/utils_node_check_v17.log` |
| `node --check local-bridge/openpatch-local-bridge.mjs` | ✅ pass | `checks/local_bridge_node_check_v17.log` |
| `node --check local-bridge/openpatch-ledger-cli.mjs` | ✅ pass | `checks/ledger_cli_node_check_v17.log` |
| Classifier regression fixtures | ✅ pass | `checks/V17_CLASSIFIER_FIXTURE_RESULTS.json` |
| Bridge health | ✅ pass | `checks/bridge_v17_health.json` |
| Bridge preflight bridge-only | ✅ pass; go_with_warnings, no blockers | `checks/bridge_v17_preflight.json` |
| GitHub upload gate without route aliases | ✅ blocked as expected | `checks/bridge_v17_github_upload_gate.json` |
| Codex brief | ✅ next_command aligned to bridge smoke when no blockers | `checks/bridge_v17_codex_brief.json` |
| Smoke plan | ✅ V17 refs | `checks/bridge_v17_smoke_plan.json` |
| Chrome handoff | ✅ V17 marker expectation | `checks/bridge_v17_chrome_handoff.json` |

## Regression fixtures covered

✅ generic candidate zip
✅ review result zip
✅ exact `changed-files.zip`
✅ `webai-roundpack.zip`
✅ unknown zip blocked
✅ ambiguous routes represented as gate/preflight fixture requirement
✅ missing aliases represented by upload-gate blocker fixture
✅ bad config preflight represented by fixed preflight logic using `config_lint.errors`

## Known gaps

⬜ Real Chrome Dev profile load not run in this sandbox.
⬜ Real GitHub fine-grained PAT upload not run.
⬜ Live Auto Continue adapter not installed.

## Decision

✅ Candidate can go to repo/relay reviewer audit.
⚠️ Only bridge-only dry-run and Chrome/CDP observe-only controlled smoke are in scope after review acceptance.
❌ Do not claim real upload/apply/install success without separate receipt evidence.


## Follow-up self-test: per-button marker/counter metadata

| Check | Result | Evidence |
|---|---:|---|
| DOM `data-openpatch-re-*` marker fields | ✅ pass | `checks/V17_BUTTON_MARKER_COUNTER_RESULTS.json` |
| Marker JSON counter fields | ✅ pass | `checks/V17_BUTTON_MARKER_COUNTER_RESULTS.json` |
| Loaded-message compact hash/message id logic | ✅ pass | `checks/V17_BUTTON_MARKER_COUNTER_RESULTS.json` |
| Counter refresh after button insertion | ✅ pass | `checks/V17_BUTTON_MARKER_COUNTER_RESULTS.json` |
| Agent button schema updated with counter fields | ✅ pass | `schemas/openpatch.agent_button.v17.schema.json` |

Acceptance mapping:

✅ Marker data is in DOM, not only docs.
✅ Codex can inspect a loaded message and read button index, visible count, message id, asset kind, route decision, allowed action, and not-approval state.
✅ Lazy-loaded page history is not required; agents should prefer `message_id + message_button_index` or `button_id` over whole-page count.
✅ Regression/self-test evidence is included.
