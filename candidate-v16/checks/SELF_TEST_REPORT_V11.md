# SELF TEST REPORT V11

## Scope
Sandbox-only checks for OPENPATCH Agent Gateway v11 candidate.

## Commands run
- `npm test` in `openpatch-main`
- `npm run check` in `openpatch-main`
- `node --check local-bridge/openpatch-local-bridge.mjs`
- `node --check local-bridge/openpatch-ledger-cli.mjs`
- Bridge smoke on isolated root `/mnt/data/openpatch_v11_bridge_test`
- CLI smoke for config-lint, smoke-plan, instances, archive-base64 dry-run, compact-summary

## Result
✅ npm test passed
✅ npm run check passed
✅ local bridge syntax check passed
✅ ledger CLI syntax check passed
✅ bridge /health passed
✅ /config-lint passed
✅ /smoke/plan passed
✅ /instances and /instances/register passed
✅ CLI config-lint / smoke-plan / instances passed
✅ archive-base64 dry-run passed
✅ compact-summary passed

## Not performed
⚠️ No real Chrome Dev profile install in this sandbox.
⚠️ No real GitHub fine-grained PAT upload in this sandbox.
⚠️ No live Auto Continue script patch in this sandbox.

## Evidence files
See `checks/bridge_v11_*.json`, `checks/npm_test_v11.log`, `checks/npm_run_check_v11.log`, `checks/local_bridge_node_check_v11.log`, and `checks/ledger_cli_node_check_v11.log`.
