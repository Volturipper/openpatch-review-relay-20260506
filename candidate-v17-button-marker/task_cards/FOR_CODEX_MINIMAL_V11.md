# FOR CODEX - OPENPATCH Agent Gateway v11

Task: run bridge-only smoke and report evidence. Do not use real GitHub token unless owner gives action-time approval.

1. Start `local-bridge/openpatch-local-bridge.mjs` with a project-local `OPENPATCH_BRIDGE_ROOT`.
2. Run:
   - `node local-bridge/openpatch-ledger-cli.mjs health`
   - `node local-bridge/openpatch-ledger-cli.mjs config-lint`
   - `node local-bridge/openpatch-ledger-cli.mjs smoke-plan --target bridge --project openpatch-smoke`
   - one dry-run `archive-base64` fixture.
3. Return JSON outputs, bridge log tail, and any failure reason.

Stop if config-lint has errors, secrets are printed, or the bridge tries to upload to a real repo without approval.
