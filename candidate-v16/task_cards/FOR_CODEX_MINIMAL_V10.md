# FOR_CODEX_MINIMAL_V10

Task: Review or smoke-test OPENPATCH Agent Gateway v10 in an isolated environment.

Default useful commands:
```text
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs routes-visual --project webai-transfer
node local-bridge/openpatch-ledger-cli.mjs routes-fix-suggestions --project webai-transfer
node local-bridge/openpatch-ledger-cli.mjs stress-routes --project webai-transfer --count 200
```

Goal: confirm route profiles are not ambiguous before any live archive upload.

Output: short evidence JSON/text with health, route visual summary, fix suggestions, and stress result.
