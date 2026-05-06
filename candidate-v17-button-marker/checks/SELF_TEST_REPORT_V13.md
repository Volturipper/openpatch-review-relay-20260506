# SELF_TEST_REPORT_V13

## Scope
v13 bridge/control surface smoke tests only. No real GitHub token, no real upload, no Chrome profile load, no live Auto Continue integration.

## Commands run

```text
cd openpatch-main
npm test
npm run check
node --check local-bridge/openpatch-local-bridge.mjs
node --check local-bridge/openpatch-ledger-cli.mjs
```

Bridge default smoke:

```text
GET /health
GET /config/snapshot
GET /config-lint
GET /projects
POST /agent/next-action
CLI config-snapshot
CLI next-action
CLI archive-base64 --dry-run
CLI next-action after archive
```

Example config smoke:

```text
GET /config-lint using route_profiles.example.json / repo_aliases.example.json / keys.local.example.json
GET /config/snapshot
GET /projects
CLI next-action --project webai-transfer
```

## Results

✅ npm test passed: 14/14.  
✅ npm run check passed.  
✅ bridge JS syntax check passed.  
✅ CLI JS syntax check passed.  
✅ default bridge smoke passed.  
✅ example config lint passed with 0 errors / 0 warnings.  
✅ dry-run archive still works and next-action detects latest receipt.

## Evidence files

```text
checks/npm_test_v13.log
checks/npm_run_check_v13.log
checks/local_bridge_node_check_v13.log
checks/ledger_cli_node_check_v13.log
checks/bridge_v13_health.json
checks/bridge_v13_config_snapshot.json
checks/bridge_v13_config_lint.json
checks/bridge_v13_projects.json
checks/bridge_v13_next_action.json
checks/bridge_v13_archive_dry_run.json
checks/bridge_v13_cli_next_action_after_archive.json
checks/bridge_v13_example_config_lint.json
checks/bridge_v13_example_config_snapshot.json
checks/bridge_v13_example_projects.json
checks/bridge_v13_example_cli_next_action.json
```

## Not done

⬜ Real Chrome Dev profile unpacked extension test.  
⬜ Real GitHub fine-grained PAT archive-only upload.  
⬜ Live Auto Continue adapter integration.  
⬜ Multi-browser real browser pressure test.
