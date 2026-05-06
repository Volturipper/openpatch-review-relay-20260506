# OPENPATCH Agent Gateway v14 Implementation Report

## Goal

Make the v13 candidate easier for Codex and other agents to use before real smoke tests by adding compact preflight APIs, GitHub upload gate checks, Auto Continue preflight, and instance compaction.

## What changed

✅ Added `/preflight` to return one compact bridge/GitHub/route/instance/Codex handoff bundle.  
✅ Added `/github/upload-gate` to check whether a project can safely route to a repo/key alias before real upload.  
✅ Added `/auto-continue/preflight` to decide whether Auto Continue should continue, pause, or request a RoundPack.  
✅ Added `/instances/compact` to summarize active/stale browser/plugin instances without dumping long instance lists.  
✅ Added CLI commands: `preflight`, `github-upload-gate`, `auto-continue-preflight`, `instances-compact`.  
✅ Updated button marker version to `openpatch.agent_button.v14`.  
✅ Kept the design Codex-friendly: the new APIs return direct `recommended_agent_action`, not long prose.

## Why it matters

v13 already had many useful individual APIs. In practice, a local agent should not call 10 endpoints and infer state by itself. v14 gives Codex one short preflight entry, while still preserving deeper APIs on demand.

## Go / no-go behavior

- `target=bridge-only`: `/preflight` does not block on GitHub upload gate.
- `target=github`: `/preflight` includes the GitHub upload gate as a blocker if repo/key/route policy is incomplete.
- `/github/upload-gate` is intentionally strict because it is the boundary before a real archive upload.

## Completed self-tests

✅ `npm test` passed.  
✅ `npm run check` passed.  
✅ bridge syntax check passed.  
✅ CLI syntax check passed.  
✅ `/health` smoke passed.  
✅ `/preflight` bridge-only smoke passed with `result=go`.  
✅ `/preflight` GitHub smoke correctly returned `result=no_go` for example config.  
✅ `/github/upload-gate` smoke passed and returned expected gate status.  
✅ `/auto-continue/preflight` smoke passed.  
✅ `/instances/compact` smoke passed.  

## Still not done

⬜ Real Chrome Dev profile unpacked extension test.  
⬜ Real GitHub fine-grained PAT archive-only upload test.  
⬜ Live Auto Continue adapter integration against the user’s current script.  
⬜ Multi-browser long-run test with real browser instances.  

## Status

v14 is a candidate implementation package. It is ready for Codex bridge-only smoke and reviewer inspection. It is not a production install or real-token upload release.
