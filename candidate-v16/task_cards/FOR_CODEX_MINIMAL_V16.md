# FOR_CODEX_MINIMAL_V16

Task: run v16 bridge-only smoke, then query next-hop and stop with JSON evidence.

Commands:

```text
node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project openpatch-smoke
node local-bridge/openpatch-ledger-cli.mjs next-hop --project openpatch-smoke
node local-bridge/openpatch-ledger-cli.mjs evidence-pack --project openpatch-smoke --target bridge-only
```

Return only: pass/fail, files created, blockers, next recommended action.
