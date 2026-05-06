# SELF_TEST_REPORT_V7

## Scope

Local sandbox self-test only. No real browser profile, no real GitHub token, no production repo.

## Commands run

✅ `cd openpatch-main && npm test`  
✅ `cd openpatch-main && npm run check`  
✅ Start Local Bridge on `127.0.0.1:17877` with isolated root  
✅ CLI health / compact-summary / archive-base64 dry-run / queue enqueue / queue claim-batch / queue-stats / receipts-recent  
✅ Parallel dry-run archive smoke with 12 concurrent archive requests on `127.0.0.1:17878`

## Results

✅ npm test: 14/14 pass  
✅ npm run check: pass  
✅ Local Bridge health: pass, schema `openpatch.bridge_health.v7`  
✅ compact-summary: pass  
✅ archive-base64 dry-run: pass  
✅ queue claim-batch: pass, lease_until present  
✅ queue-stats: pass  
✅ receipts-recent: pass  
✅ parallel archive smoke: 12/12 ok, 3 unique SHA groups, 9 duplicate detections

## Evidence files

- `checks/npm_test_v7.log`
- `checks/npm_run_check_v7.log`
- `checks/bridge_v7_health.json`
- `checks/bridge_v7_compact_summary_empty.json`
- `checks/bridge_v7_archive_dry_run.json`
- `checks/bridge_v7_compact_summary_after_archive.json`
- `checks/bridge_v7_queue_enqueue.json`
- `checks/bridge_v7_queue_claim_batch.json`
- `checks/bridge_v7_queue_stats.json`
- `checks/bridge_v7_receipts_recent.json`
- `checks/bridge_v7_parallel_archive_smoke.json`

## Not tested yet

⚠️ Real Chrome Dev profile unpacked extension install.  
⚠️ Real ChatGPT attachment capture in browser.  
⚠️ Real GitHub fine-grained PAT upload.  
⚠️ Multiple physical browsers over long-running sessions.  
⚠️ Exact integration into the user's current ChatGPT Auto Continue script.

## Current decision

v7 is a stronger candidate than v6 for agent control and multi-page usage, but still should go through isolated browser smoke and one test-repo upload before any daily use.
