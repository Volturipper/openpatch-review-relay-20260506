# FOR_CODEX_MINIMAL_V17

Task: run OpenPatch RE v17 bridge-only dry-run smoke and return JSON evidence. Do not perform real GitHub upload, production install, or live Auto Continue install.

Default commands:

```text
node local-bridge/openpatch-local-bridge.mjs
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs preflight --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs codex-brief --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project openpatch-smoke --round v17-smoke
node local-bridge/openpatch-ledger-cli.mjs smoke-plan --project openpatch-smoke --target all
```

Return:

```text
health.json
preflight.json
codex_brief.json
bridge_smoke_run.json
smoke_plan.json
short conclusion
```

Stop if any output prints secrets, PATs, cookies, `.env`, or browser profile internals.
