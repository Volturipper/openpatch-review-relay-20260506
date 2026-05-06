# v8 Agent API Quick Reference

## Bridge endpoints

```text
GET  /health
GET  /agent/compact-summary?project=<project>
GET  /agent/summary?project=<project>
GET  /rate-limit/status
GET  /events?limit=<n>
POST /events/compact
POST /archive/base64
GET  /latest?project=<project>
GET  /receipt?project=<project>&round=<round_id>
GET  /queue/stats?project=<project>
POST /queue/claim-batch
POST /queue/release
POST /queue/retry
POST /auto-continue/plan
```

## New v8 CLI commands

```text
node local-bridge/openpatch-ledger-cli.mjs rate-limit-status
node local-bridge/openpatch-ledger-cli.mjs events-compact --max-events 2000
node local-bridge/openpatch-ledger-cli.mjs stress-archive --project webai-transfer --count 50 --parallel 10
```

## Recommended Codex default flow

```text
1. compact-summary --project <project>
2. latest --project <project>
3. receipt --project <project> --round <latest_round>
4. queue-stats --project <project>
5. rate-limit-status
```

Codex should use compact-summary first because it is intentionally short and avoids reading full logs or transcripts by default.
