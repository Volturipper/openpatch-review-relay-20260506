# V11 Agent API Quick Reference

## Bridge
```text
GET  /health
GET  /config-lint
POST /smoke/plan
GET  /instances
POST /instances/register
GET  /agent/compact-summary?project=<project>
POST /archive/base64
```

## CLI
```text
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs config-lint
node local-bridge/openpatch-ledger-cli.mjs smoke-plan --target bridge --project openpatch-smoke
node local-bridge/openpatch-ledger-cli.mjs instances
node local-bridge/openpatch-ledger-cli.mjs instances-register --instance chrome-dev-001 --project webai-transfer --route-profile default
```

## Agent rule
Prefer `compact-summary`, `config-lint`, `smoke-plan`, and `latest` before reading large roundpacks.
