# FOR_CODEX_MINIMAL_V14

Task: run bridge-only smoke for OPENPATCH Agent Gateway v14.

Default commands:

```bash
node local-bridge/openpatch-local-bridge.mjs
node local-bridge/openpatch-ledger-cli.mjs preflight --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs readiness --project openpatch-smoke --target bridge-only
node local-bridge/openpatch-ledger-cli.mjs evidence-template --project openpatch-smoke --target bridge-only
```

Allowed: local bridge-only checks, CLI checks, JSON evidence generation.

Do next if preflight is `go` or `go_with_warnings`: return evidence JSON with command outputs and any blockers/warnings.

Do not do in this bridge-only task: real GitHub token upload, real Chrome profile install, Auto Continue script patching, production repo changes.
