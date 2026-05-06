# FOR CODEX — v5 minimal task

Goal: review or smoke-test the v5 OpenPatch Agent Gateway candidate.

Fast path:

```text
node local-bridge/openpatch-local-bridge.mjs
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs config-status
node local-bridge/openpatch-ledger-cli.mjs archive-base64 --project demo --round r001 --file webai-roundpack.zip --dry-run
node local-bridge/openpatch-ledger-cli.mjs latest --project demo
```

What this proves:

```text
Bridge starts, aliases are visible without raw tokens, dry-run archive writes receipt/latest/sha-index, and Codex can query short JSON status.
```

Next useful test after owner approval:

```text
Use a fine-grained GitHub token with one test archive repo and run a single real /archive/base64 upload.
```
