# v14 Preflight Gate and Smoke Path

## Purpose

v14 reduces agent uncertainty. Codex can ask the bridge one question: "What is the next safe and useful action?" The bridge answers with a compact preflight bundle and concrete commands.

## Fast path

```text
Codex
  ↓
/preflight target=bridge-only
  ↓
bridge-only smoke if go/go_with_warnings
  ↓
/evidence-template
  ↓
return evidence JSON
```

## GitHub upload path

```text
Codex
  ↓
/github/upload-gate
  ↓
fix route/repo/key blockers if any
  ↓
archive-base64 dry-run
  ↓
single fine-grained PAT test repo upload
  ↓
receipt/latest/result evidence
```

## Auto Continue path

```text
Auto Continue
  ↓
/auto-continue/preflight
  ↓
continue if recommended_agent_action=continue_auto_flow
  ↓
request RoundPack if should_request_roundpack=true
  ↓
wait for upload receipt before next phase if required
```

## Why this avoids slowdown

The bridge gives Codex short status and default commands. Codex does not need to parse long docs or inspect every historical round. The detailed reports remain in the package for reviewers only.
