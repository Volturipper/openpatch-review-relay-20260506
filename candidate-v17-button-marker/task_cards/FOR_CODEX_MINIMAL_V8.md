# FOR_CODEX_MINIMAL_V8

Task: review/use OpenPatch Agent Gateway v8 candidate as a local private artifact gateway.

Start here:
```text
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs compact-summary --project <project>
node local-bridge/openpatch-ledger-cli.mjs rate-limit-status
```

Useful checks:
```text
node local-bridge/openpatch-ledger-cli.mjs stress-archive --project test --count 50 --parallel 10
node local-bridge/openpatch-ledger-cli.mjs events-compact --max-events 2000
```

Output evidence: command, JSON result path, SHA256 if packaging.
