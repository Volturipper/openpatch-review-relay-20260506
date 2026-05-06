# V11 Real Smoke Handoff

## Bridge-only smoke
No real browser or GitHub token required.

1. Start bridge with project-local root.
2. Run `health`, `config-lint`, `smoke-plan --target bridge`.
3. Run one dry-run archive fixture.
4. Return JSON outputs from `checks/`.

## Chrome Dev profile smoke
Use a dedicated Chrome Dev profile only. Load unpacked extension and verify button marker v11 through page event API.

## GitHub test repo smoke
Use a single fine-grained PAT bound to one temporary archive repository. Test archive-only upload only. Do not apply patches or touch production repos.

## Auto Continue smoke
Integrate adapter as a module/configurable hook. Auto Continue requests RoundPack and waits for OpenPatch receipt; it does not store GitHub keys.
