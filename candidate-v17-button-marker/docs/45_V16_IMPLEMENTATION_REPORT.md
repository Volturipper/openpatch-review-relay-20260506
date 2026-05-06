# OPENPATCH Agent Gateway v16 Implementation Report

## Goal

Move from bridge-only smoke readiness to the next executable chain: Chrome Dev profile smoke, GitHub single test-repo upload handoff, Auto Continue live adapter handoff, and evidence-pack capture.

## Added APIs

- `/smoke/next-hop`
- `/chrome/smoke-handoff`
- `/github/test-upload-handoff`
- `/auto-continue/live-handoff`
- `/smoke/evidence-pack`

## Design stance

Convenience-first for Codex and other agents: short commands, compact next-hop sequence, receipts, and evidence JSON. High-impact real actions remain represented as explicit handoff steps rather than hidden UI guesses.

## Status

Candidate implementation. Local syntax and bridge smoke checks included in `checks/SELF_TEST_REPORT_V16.md`.
