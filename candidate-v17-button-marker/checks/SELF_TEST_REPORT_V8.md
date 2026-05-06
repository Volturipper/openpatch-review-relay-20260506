# SELF_TEST_REPORT_V8

## Scope
Sandbox-only candidate checks. No real GitHub token, no real browser profile, no production repo.

## Results

✅ `npm test` in `openpatch-main`: passed.
✅ `npm run check` in `openpatch-main`: passed.
✅ `node --check` for local bridge: passed.
✅ `node --check` for ledger CLI: passed.
✅ `node --check` for Auto Continue v8 adapter: passed.
✅ Bridge `/health`: returned `openpatch.bridge_health.v8`.
✅ Bridge `/rate-limit/status`: returned status JSON.
✅ CLI `stress-archive --count 50 --parallel 10`: completed 50 dry-run archives.
✅ Bridge `/events/compact`: completed.

## Not done

⚠️ Real Chrome Dev profile extension load test.
⚠️ Real fine-grained GitHub PAT upload test.
⚠️ Live Auto Continue integration test.
⚠️ Multi-browser long-running test.
