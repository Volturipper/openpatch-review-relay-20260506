# SELF_TEST_REPORT_V4

## Scope

Local sandbox only. No real GitHub token, no real browser profile, no real repository upload, no production service.

## Commands Run

✅ `cd openpatch-main && npm run check`  
✅ `node --check local-bridge/openpatch-local-bridge.mjs`  
✅ `node --check local-bridge/openpatch-ledger-cli.mjs`  
✅ Start Local Bridge on `127.0.0.1:17874` with project-local temp root  
✅ `GET /health`  
✅ CLI `health`  
✅ CLI `resolve --url ... --title ...`  
✅ `POST /queue/enqueue`  
✅ `GET /queue/status`  
✅ `POST /receipts`  
✅ `GET /latest?project=webai-transfer`  
✅ `GET /sha-index`  
✅ duplicate SHA receipt smoke test

## Results

✅ `npm run check`: pass, 14/14 tests pass, manifest parse ok.  
✅ Local Bridge syntax check: pass.  
✅ Ledger CLI syntax check: pass.  
✅ Local Bridge smoke test: pass.  
✅ Route resolver selected `webai-transfer-designer-chat` for ChatGPT URL/title hint.  
✅ Queue accepted task and returned idempotency key.  
✅ Receipt wrote latest and sha-index.  
✅ Duplicate SHA returns `received_duplicate_sha` with first/latest round ids.

## Evidence Files

- `checks/npm_run_check_v4.log`
- `checks/local_bridge_node_check_v4.log`
- `checks/ledger_cli_node_check_v4.log`
- `checks/bridge_v4_health.json`
- `checks/bridge_v4_cli_health.json`
- `checks/bridge_v4_route_resolve.json`
- `checks/bridge_v4_queue_enqueue.json`
- `checks/bridge_v4_queue_status.json`
- `checks/bridge_v4_receipt_post.json`
- `checks/bridge_v4_latest.json`
- `checks/bridge_v4_sha_index.json`
- `checks/bridge_v4_dup_receipt_2.json`

## Not Tested

⬜ Real Chrome/Chrome Dev extension installation.  
⬜ Real ChatGPT DOM attachment upload.  
⬜ Real GitHub Contents API upload.  
⬜ Multi-browser live concurrent upload.  
⬜ Bridge-side key alias upload proxy.
