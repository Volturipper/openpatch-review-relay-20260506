# SELF_TEST_REPORT_V10

## Commands executed in sandbox
✅ `npm test` inside `openpatch-main`.
✅ `npm run check` inside `openpatch-main`.
✅ `node --check local-bridge/openpatch-local-bridge.mjs`.
✅ `node --check local-bridge/openpatch-ledger-cli.mjs`.
✅ `node --check auto-continue-integration/roundpack_scheduler_adapter_v9.js`.
✅ Bridge `/health` smoke.
✅ Bridge `/routes/visual-map` smoke.
✅ Bridge `/routes/fix-suggestions` smoke.
✅ Bridge `/stress/routes` with 150 synthetic route samples.
✅ CLI `routes-visual` smoke.
✅ CLI `routes-fix-suggestions` smoke.
✅ CLI `stress-routes --count 200` smoke.

## Notes
All tests are sandbox/local dry-run only. No real GitHub token was used, no real Chrome Dev profile was modified, and no real repository was written.
