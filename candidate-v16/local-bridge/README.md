# Local OpenPatch Agent Bridge MVP v5

Purpose: local agent gateway for OpenPatch Archive/RoundPack workflows. It keeps GitHub key aliases and repo aliases in the local environment, receives browser/plugin requests, uploads or dry-runs RoundPack archives, and exposes short status APIs for Codex and other agents.

Start:

```text
node local-bridge/openpatch-local-bridge.mjs
```

Recommended env:

```text
OPENPATCH_BRIDGE_PORT=17873
OPENPATCH_BRIDGE_ROOT=D:\Codex\relay\openpatch-bridge
OPENPATCH_KEYS_FILE=D:\Codex\relay\openpatch-bridge\keys.local.json
OPENPATCH_REPOS_FILE=D:\Codex\relay\openpatch-bridge\repo_aliases.json
OPENPATCH_ROUTES_FILE=D:\Codex\relay\openpatch-bridge\route_profiles.json
```

Main endpoints:

```text
GET  /health
GET  /config-status        # sanitized: aliases only, no raw tokens
GET  /routes
GET  /repos
GET  /keys                 # aliases + has_token, no raw tokens
POST /resolve-route
POST /archive/base64       # bridge-side GitHub upload or dry-run
GET  /latest?project=...
GET  /status
GET  /queue/status
GET  /sha-index
POST /receipts
POST /queue/enqueue
```

Codex CLI:

```text
node local-bridge/openpatch-ledger-cli.mjs health
node local-bridge/openpatch-ledger-cli.mjs config-status
node local-bridge/openpatch-ledger-cli.mjs archive-base64 --project demo --round r001 --file webai-roundpack.zip --dry-run
node local-bridge/openpatch-ledger-cli.mjs latest --project demo
```

Key rule: the extension can use the bridge as upload proxy. The plugin front-end only needs repo_alias/key_alias and bridge URL; raw API keys stay local.
