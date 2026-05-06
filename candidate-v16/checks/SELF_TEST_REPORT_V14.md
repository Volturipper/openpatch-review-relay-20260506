# SELF_TEST_REPORT_V14

## Scope

Tested v14 changes in the sandbox only. No real Chrome profile, GitHub token, GitHub repo, browser account, or production service was used.

## Commands run

```text
cd openpatch-main
npm test
npm run check
node --check local-bridge/openpatch-local-bridge.mjs
node --check local-bridge/openpatch-ledger-cli.mjs
```

Bridge smoke used a temporary local root and example route/repo/key configs.

## Results

✅ npm test passed.  
✅ npm run check passed.  
✅ local bridge syntax check passed.  
✅ ledger CLI syntax check passed.  
✅ /health returned `openpatch.bridge_health.v14`.  
✅ /preflight target=bridge-only returned `result=go`.  
✅ /preflight target=github returned `result=no_go` with expected upload gate blocker on example config.  
✅ /github/upload-gate returned valid `openpatch.github_upload_gate.v14`.  
✅ /auto-continue/preflight returned valid `openpatch.auto_continue_preflight.v14`.  
✅ /instances/compact returned valid `openpatch.instances_compact.v14`.  
✅ CLI wrappers for the new APIs returned valid JSON.

## Evidence files

```text
checks/npm_test_v14.log
checks/npm_run_check_v14.log
checks/local_bridge_node_check_v14.log
checks/ledger_cli_node_check_v14.log
checks/bridge_v14_health.json
checks/bridge_v14_preflight.json
checks/bridge_v14_preflight_github.json
checks/bridge_v14_github_upload_gate.json
checks/bridge_v14_auto_continue_preflight.json
checks/bridge_v14_instances_compact.json
checks/bridge_v14_cli_preflight.json
checks/bridge_v14_cli_github_upload_gate.json
checks/bridge_v14_cli_auto_continue_preflight.json
checks/bridge_v14_cli_instances_compact.json
```

## Not tested

⬜ Real Chrome Dev unpacked extension install.  
⬜ Real GitHub fine-grained PAT upload.  
⬜ Live Auto Continue adapter integration.  
⬜ Long-running multi-browser real-world queue behavior.
