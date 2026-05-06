# V17 Reviewer Fix Closure Matrix

| Reviewer requirement | V17 closure |
|---|---|
| Hard classifier and asset_kind schema | Added `classifyOpenPatchAsset` and `openpatch.asset_classifier.v17.schema.json` |
| Unknown .zip blocked | `random.zip` fixture expects and receives `unknown_blocked` |
| UI marker fields | Added marker/data fields for asset_kind, route_decision, reason, allowed_action, not_approval |
| Preflight logic | Uses `readiness.go_no_go` and `config_lint.errors` |
| githubUploadGate aliases and ambiguity | Uses `route_context` aliases; blocks ambiguous route context |
| Smoke plan stale refs | V17 smoke plan references V17 files and agent marker |
| codexBrief next_command | Blockers route to preflight, not bridge smoke |
| Regression fixtures | Added fixture file and classifier results; bridge smoke captures gate/preflight evidence |
| Compact contract | Added `openpatch-agent-gateway-contract-v17.md` |
| Auto Continue heartbeat | Added schema and V17 live adapter contract |
| Hosted assets as evidence | Documented in contract and GitHub upload task card |
