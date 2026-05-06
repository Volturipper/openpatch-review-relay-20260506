# Required Designer Changes - Round 1

## Must fix before GitHub upload/apply/live automation

1. Implement hard route classifier and asset_kind schema; unknown .zip must be unknown_blocked.
2. Make UI marker include asset_kind, route_decision, route_decision_reason, allowed_action, and not_approval=true for archive/review evidence.
3. Fix preflightBundle blocker logic to use readiness.go_no_go and config_lint.errors.
4. Fix githubUploadGate to use route.route_context aliases and reject ambiguous route_context.
5. Update v16 smokePlan stale V11/V15 references.
6. Make codexBrief next_command align with blockers.

## Must add regression coverage

1. Add regression fixtures for generic candidate zip, review result zip, exact changed-files.zip, webai-roundpack.zip, ambiguous routes, missing aliases, and bad config preflight.
2. Add a compact openpatch-agent-gateway-contract-v16.md with exact DOM markers, page events, button states, queue/latest/receipt fields, and failure states.
3. Add Auto Continue heartbeat contract and receipt-missing stop condition.

## Should add docs/contracts

2. Document GitHub-hosted assets as hosted evidence only, not merge/install/approval.

## Suggested ASCII asset files

- `docs/48_V16_ROUTE_CLASSIFIER_AND_ASSET_KIND.md`
- `docs/49_V16_AGENT_GATEWAY_CONTRACT.md`
- `docs/50_V16_PREFLIGHT_GATE_FIX.md`
- `docs/51_V16_CONTROLLED_SMOKE_PLAN.md`
- `schemas/openpatch.asset_kind.v1.schema.json`
- `schemas/openpatch.agent_gateway_contract.v16.schema.json`
- `schemas/openpatch.preflight_result.v16.schema.json`
- `tests/fixtures/asset-kind-classifier-v16.json`
- `tests/fixtures/preflight-bad-config-must-block-v16.json`
- `tests/fixtures/github-route-alias-positive-v16.json`
- `tests/fixtures/agent-button-marker-v16.json`
- `checks/SELF_TEST_REPORT_V16_1.md`
- `reviews/openpatch-review-decision-round-1.json`

## Stop doing

- Do not rely on generic `.zip` text heuristics for route safety.
- Do not let `preflight` override `readiness.no_go`.
- Do not let Codex infer approval from GitHub-hosted files.
- Do not move to real upload until route alias/key/repo binding is exact and owner-approved.
