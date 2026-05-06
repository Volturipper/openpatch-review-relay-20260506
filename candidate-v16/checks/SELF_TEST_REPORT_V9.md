# SELF_TEST_REPORT_V9

## Scope

V9 self-test covered code syntax, extension tests, local bridge API, route conflict detector, queue reclaim, and 300-round dry-run archive stress.

## Results

✅ `npm test` passed.  
✅ `npm run check` passed.  
✅ `node --check local-bridge/openpatch-local-bridge.mjs` passed.  
✅ `node --check local-bridge/openpatch-ledger-cli.mjs` passed.  
✅ `node --check auto-continue-integration/roundpack_scheduler_adapter_v9.js` passed.  
✅ Bridge `/health` passed.  
✅ Bridge static `/routes/conflicts` passed.  
✅ Bridge dynamic `/routes/conflicts` passed.  
✅ Bridge `/resolve-route` returned route candidates / ambiguity info.  
✅ CLI `routes-conflicts` passed.  
✅ CLI `stress-archive --count 300 --parallel 20` passed with 300 dry-run archive receipts.  
✅ Queue `enqueue/claim/reclaim-expired` smoke passed.

## Evidence files

- `checks/npm_test_v9.log`
- `checks/npm_run_check_v9.log`
- `checks/local_bridge_node_check_v9.log`
- `checks/ledger_cli_node_check_v9.log`
- `checks/auto_continue_adapter_node_check_v9.log`
- `checks/bridge_v9_health.json`
- `checks/bridge_v9_routes_conflicts_static.json`
- `checks/bridge_v9_routes_conflicts_dynamic.json`
- `checks/bridge_v9_resolve_route.json`
- `checks/bridge_v9_cli_routes_conflicts.json`
- `checks/bridge_v9_stress_archive_300.json`
- `checks/bridge_v9_queue_reclaim_expired.json`

## Not done

⚠️ No real Chrome Dev profile installation was performed in this sandbox.  
⚠️ No real GitHub fine-grained PAT upload was performed.  
⚠️ No live user Auto Continue script was patched in place.  
⚠️ No real multi-browser long-run test was performed.

## Decision

V9 is a stronger candidate for controlled local smoke and test-repo archive-only upload. It is not a final production installation package.
