# SELF_TEST_REPORT_V6

## 范围

本轮只在 ChatGPT sandbox 内对候选源码做无副作用自测。未触达真实 GitHub token、真实浏览器 profile、真实用户仓库或生产服务。

## 命令与结果

✅ `node --check openpatch-main/src/content-script.js` pass  
✅ `node --check openpatch-main/src/background.js` pass  
✅ `node --check local-bridge/openpatch-local-bridge.mjs` pass  
✅ `node --check local-bridge/openpatch-ledger-cli.mjs` pass  
✅ `cd openpatch-main && npm test` pass，14/14 tests passed  
✅ `cd openpatch-main && npm run check` pass，14/14 tests passed，manifest parse OK  
✅ Local Bridge `/health` pass  
✅ Local Bridge `/auto-continue/plan` pass  
✅ Local Bridge `/archive/base64` dry-run pass  
✅ Local Bridge `/agent/summary` pass  
✅ Local Bridge `/receipt` pass  
✅ Queue enqueue / claim / retry pass  
✅ `/events` pass  
✅ Codex CLI `agent-summary` pass

## 证据文件

```text
checks/npm_test_v6.log
checks/npm_run_check_v6.log
checks/bridge_v6_health.json
checks/bridge_v6_auto_continue_plan.json
checks/bridge_v6_archive_dry_run.json
checks/bridge_v6_agent_summary.json
checks/bridge_v6_receipt_query.json
checks/bridge_v6_queue_enqueue.json
checks/bridge_v6_queue_claim.json
checks/bridge_v6_queue_retry.json
checks/bridge_v6_events.json
checks/bridge_v6_cli_agent_summary.json
checks/bridge_v6_server.log
```

## 未完成

⬜ 未做真实 Chrome Dev profile 安装测试。  
⬜ 未做真实 GitHub fine-grained PAT 上传测试。  
⬜ 未做真实多页面/多浏览器并发压力测试。  
⬜ 未做 UI/UX polish。
