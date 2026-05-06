# v5 Multi-key / Multi-repo Plan

## Problem

The user may run OpenPatch across many ChatGPT conversations, many browsers, and many GitHub repositories. Manually setting a raw token and repository in each browser profile is error-prone.

## v5 direction

Use local aliases:

```text
key_alias  → local API token source
repo_alias → GitHub owner/repo/branch/archive root
route_profile → maps page/chat/project to repo_alias + key_alias
```

The extension only needs:

```text
bridge URL
route profile/project hint
repo_alias/key_alias if manual override is needed
```

The bridge handles:

```text
API key lookup
repo lookup
archive path building
GitHub upload or dry-run
receipt/latest/sha-index updates
```

## Files

```text
local-bridge/keys.local.example.json
local-bridge/repo_aliases.example.json
local-bridge/route_profiles.example.json
```

Real key files should stay local and should not be uploaded into Web AI chats.
