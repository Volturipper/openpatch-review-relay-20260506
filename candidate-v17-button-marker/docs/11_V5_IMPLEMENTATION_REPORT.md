# OPENPATCH Agent Gateway v5 Implementation Report

## Goal

Move high-value GitHub credentials and multi-repo routing out of the browser extension and into a local Agent Bridge, while keeping OpenPatch convenient for Codex, Auto Continue, and other agents.

## What changed

✅ Added bridge-side GitHub upload proxy: `POST /archive/base64`.
✅ Added local key alias file support: `keys.local.json` / `OPENPATCH_KEYS_FILE`.
✅ Added repo alias file support: `repo_aliases.json` / `OPENPATCH_REPOS_FILE`.
✅ Added sanitized config API: `GET /config-status`, `GET /repos`, `GET /keys`.
✅ Added dry-run archive path for testing without real GitHub token.
✅ Added Codex CLI command: `archive-base64`.
✅ Updated extension config with `bridgeHandlesUpload`.
✅ Updated extension background flow: when bridge upload proxy is enabled, RoundPack archive upload goes to local bridge instead of direct GitHub Contents API.
✅ Kept direct GitHub upload compatibility for old OpenPatch behavior.

## Why this matters

This version makes the tool more useful for many pages, many browsers, many GitHub repositories, and many API keys. The browser plugin can remain a lightweight page/file detector with agent markers, while the local bridge becomes the controlled, queryable, key-aware gateway for Codex and other agents.

## Main new flow

```text
ChatGPT / Web AI page
  → OpenPatch detects file and button marker
  → Extension sends file base64 + route context to local bridge
  → Local bridge resolves repo_alias/key_alias
  → Local bridge uploads to GitHub archive repo or dry-runs
  → Local bridge writes local receipt/latest/sha-index
  → Codex queries CLI/API for latest/status/result
```

## Current status

Candidate implementation. Tested in sandbox with dry-run bridge upload and existing plugin unit checks. No real GitHub token upload test was performed in this environment.
