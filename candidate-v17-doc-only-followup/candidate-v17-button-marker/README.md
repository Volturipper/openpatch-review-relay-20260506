# OpenPatch RE v17 Button-Marker Candidate

This candidate is the OpenPatch RE v17 button-marker follow-up for controlled continuation.

OpenPatch RE is the second-developed line derived from the original AFUMU/OpenPatch baseline. This package is file-oriented for Codex, reviewer, Auto Continue, and local agent workflows.

## Current reviewer status

- Reviewer decision: pass for controlled continuation only.
- Allowed next actions:
  - bridge-only dry-run smoke
  - Chrome/CDP observe-only marker/API smoke
- Still blocked:
  - real GitHub upload or apply
  - production install
  - live Auto Continue adapter install
  - secrets, PAT, cookie, `.env`, or browser-profile exposure

GitHub-hosted assets, if used, are hosted evidence only. They are not approval to merge, install, apply, upload to a real repository, or expose secrets.

## Canonical Codex entry points

Codex and other agents should treat these as the canonical v17 entry points:

1. `docs/49_V17_AGENT_API_QUICK_REFERENCE.md`
2. `docs/51_V17_BUTTON_MARKER_COUNTER_FOLLOWUP.md`
3. `docs/openpatch-agent-gateway-contract-v17.md`

Default Codex behavior: read the canonical entry points first, then run only the controlled smoke scope explicitly allowed above.

## v17 button-marker focus

The v17 button-marker follow-up adds stable per-button DOM marker and counter metadata so Codex does not rely on whole-page button counts under ChatGPT lazy loading.

Each OpenPatch RE button should expose local, inspectable DOM metadata such as:

- `data-openpatch-re-button-id`
- `data-openpatch-re-button-index`
- `data-openpatch-re-visible-count`
- `data-openpatch-re-message-id`
- `data-openpatch-re-asset-kind`
- `data-openpatch-re-route-decision`
- `data-openpatch-re-allowed-action`
- `data-openpatch-re-not-approval`

Codex should be able to inspect a loaded message and identify the exact button index, visible count, asset kind, route decision, allowed action, and `not_approval=true` without requiring lazy-loaded page history.

## Controlled smoke evidence expected from Codex

For bridge-only dry-run smoke and Chrome/CDP observe-only marker/API smoke, return a compact evidence packet containing:

- exact command or CDP observation step used
- no-secrets statement
- marker/API JSON or text summary
- sample `asset_kind`, `route_decision`, `allowed_action`, and `not_approval` values
- bridge dry-run receipt or dry-run result
- failure list, if any

Do not include secrets, PATs, cookies, `.env` content, raw browser profile internals, or private credentials.

## Do not do

- Do not run real GitHub upload/apply.
- Do not install to production.
- Do not install or enable the live Auto Continue adapter.
- Do not read, print, request, or expose secrets, PATs, cookies, `.env`, or browser profile internals.
- Do not treat GitHub-hosted candidate assets as merge/install/approval.

## Recommended next action

Run repo/relay reviewer audit of this doc-only follow-up, then allow Codex to perform bridge-only dry-run and Chrome/CDP observe-only marker/API smoke within the controlled scope above.
