# SELF TEST REPORT V15

## Scope

Candidate package: openpatch_agent_gateway_v15_candidate

## Commands executed in sandbox

```text
cd openpatch-main
npm test
npm run check
node --check local-bridge/openpatch-local-bridge.mjs
node --check local-bridge/openpatch-ledger-cli.mjs
curl /health
curl /codex/brief
curl /operation/brief
curl /smoke/bridge-only/run
CLI codex-brief
CLI operation-brief
CLI bridge-smoke-run
```

## Results

✅ npm test: pass  
✅ npm run check: pass  
✅ local bridge syntax: pass  
✅ CLI syntax: pass  
✅ /health: pass  
✅ /codex/brief: pass  
✅ /operation/brief: pass  
✅ /smoke/bridge-only/run: pass  
✅ CLI bridge-smoke-run: pass  

## Evidence files

```text
checks/npm_test_v15.log
checks/npm_run_check_v15.log
checks/local_bridge_node_check_v15.log
checks/ledger_cli_node_check_v15.log
checks/bridge_v15_health.json
checks/bridge_v15_codex_brief.json
checks/bridge_v15_operation_brief.json
checks/bridge_v15_smoke_run.json
checks/bridge_v15_cli_codex_brief.json
checks/bridge_v15_cli_operation_brief.json
checks/bridge_v15_cli_smoke_run.json
```

## Important limitations

⬜ No real Chrome Dev profile install test performed in this sandbox.  
⬜ No real GitHub fine-grained PAT upload test performed.  
⬜ No live Auto Continue integration test performed.  

## Go/no-go

✅ Suitable for Codex bridge-only smoke handoff.  
⚠️ Not a production install/release package.  
