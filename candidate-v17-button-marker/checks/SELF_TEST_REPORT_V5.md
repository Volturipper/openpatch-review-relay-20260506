# SELF TEST REPORT v5

## Scope

Sandbox-only test of the candidate package. No real GitHub token was used. No real browser profile was installed.

## Checks

✅ `npm test` passed: 14/14 tests.
✅ `npm run check` passed: JS checks + manifest parse.
✅ Local Bridge v5 started on localhost in sandbox.
✅ `GET /health` returned `openpatch.bridge_health.v5`.
✅ `GET /config-status` returned sanitized aliases without raw token values.
✅ Codex CLI `health` worked against bridge URL.
✅ Codex CLI `archive-base64 --dry-run` worked.
✅ Bridge wrote local latest and sha-index after dry-run archive.

## Evidence files

```text
checks/npm_test_v5.log
checks/npm_run_check_v5.log
checks/bridge_v5_health.json
checks/bridge_v5_config_status.json
checks/bridge_v5_archive_dry_run.json
checks/bridge_v5_latest.json
checks/bridge_v5_sha_index.json
```

## Not tested

⬜ Real Chrome extension install.
⬜ Real GitHub token upload.
⬜ Multi-browser concurrent stress test.
⬜ Auto Continue integration on a live ChatGPT page.
