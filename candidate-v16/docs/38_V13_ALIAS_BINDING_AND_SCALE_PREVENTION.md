# v13 Alias Binding and Scale Prevention

## Problem
When the same plugin runs across many ChatGPT pages, browser profiles, projects, API keys, and GitHub repositories, the likely failures are:

- wrong repo alias selected
- wrong key alias selected
- one chat overwrites another project's latest pointer
- old browser instance keeps stale context
- route profile ambiguity causes an upload to the wrong ledger
- Codex wastes tokens reading long logs instead of asking for state

## v13 prevention mechanisms

### 1. Explicit route bindings
Each route profile binds:

```text
project -> repo_alias -> key_alias
```

### 2. Repo policy
Repo aliases may declare:

```json
"allowed_projects": ["webai-transfer", "ai-chat-file-relay"]
```

A route using that repo for another project is reported by `config-lint`.

### 3. Key policy
Key aliases may declare:

```json
"allowed_repo_aliases": ["webai-round-ledger"]
```

A route using that key for a different repo is reported by `config-lint`.

### 4. Codex next-action API
Codex does not need to inspect every file. It can call:

```text
next-action --project <project>
```

and receive a compact action list.

### 5. Project list API
Agents can list projects and latest statuses before deciding whether to continue, archive, fetch, or retry.

## What v13 does not solve yet

⬜ Real Chrome Dev profile installation smoke.  
⬜ Real GitHub PAT upload smoke.  
⬜ Live Auto Continue script integration.  
⬜ Long-running multi-browser real-world test.  
⬜ UI editor for route profiles and alias policies.
