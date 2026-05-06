# V11 Status and Next Tasks

## Status
✅ Candidate package built
✅ Sandbox self-tests passed
✅ Bridge-only smoke entry prepared
⚠️ Real Chrome/GitHub/Auto Continue smoke not performed in sandbox

## Next tasks
1. Local Codex: run bridge-only smoke from `task_cards/FOR_CODEX_MINIMAL_V11.md`.
2. Owner-approved smoke: load unpacked extension in dedicated Chrome Dev profile.
3. Owner-approved smoke: one archive-only upload to a temporary GitHub archive repo using fine-grained PAT.
4. AI/Codex implementation: integrate Auto Continue adapter as a small module.
5. Reviewer: review `PATCH_FROM_V10_TO_V11.diff`, v11 docs, schemas, and self-test outputs.

## Do not expand first
Do not start a broad rewrite before confirming v11 bridge-only smoke and route/config lint behavior.
