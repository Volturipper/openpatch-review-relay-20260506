# OpenPatch RE Agent Gateway Contract v17

This is the compact control contract for OpenPatch RE v17. It distinguishes hosted evidence from approval or install state.

## DOM marker

Each OpenPatch RE button should expose these machine-readable fields through `data-*` and `data-openpatch-context`:

- `schemaVersion`: `openpatch.agent_button.v17`
- `status`: `ready | blocked | capturing | uploading | uploaded | failed | stale`
- `fileName`
- `asset_kind`: `changed_files_zip | patch_diff | roundpack_archive | review_evidence | candidate_or_evidence_archive | forced_archive | unknown_zip | unknown`
- `route_decision`: `patch_upload_allowed | archive_allowed | unknown_blocked`
- `route_decision_reason`
- `allowed_action`: `upload_openpatch_content | archive_roundpack_content | none`
- `not_approval`: `true` for archive/review/candidate/evidence assets
- `routeContext.project`
- `routeContext.routeProfile`
- `routeContext.repoAlias`
- `routeContext.keyAlias`
- `recommendedAgentAction`
- `decisionHint`
- `stalenessStatus`

Unknown `.zip` files must be `asset_kind=unknown_zip`, `route_decision=unknown_blocked`, `allowed_action=none`, `canUpload=false`.

## Page events

- `openpatch:api:get-buttons` -> `openpatch:api:buttons`
- `openpatch:api:get-runtime-status` -> `openpatch:api:runtime-status`
- `openpatch:api:set-route-context` -> `openpatch:agent-status`
- `openpatch:api:trigger-upload` -> `openpatch:api:trigger-upload-result`
- `openpatch:api:get-roundpack-prompt` -> `openpatch:api:roundpack-prompt`
- `openpatch:api:get-compact-summary` -> `openpatch:api:compact-summary`

## Bridge status fields

Queue, latest and receipt APIs must return compact machine-readable fields:

- queue item: `idempotency_key`, `project`, `round_id`, `status`, `action`, `claimed_by`, `lease_until`
- latest: `project`, `latest_round`, `status`, `latest.file_sha256`, `updated_at`
- receipt: `project`, `round_id`, `file_sha256`, `status`, `payload`, `received_at`

## Failure states

- `unknown_blocked`: hard classifier blocked an asset.
- `route_context_ambiguous`: route resolution is ambiguous; no real upload.
- `config_lint_errors`: key/repo/route aliases are invalid.
- `receipt_missing`: uploaded marker exists but no receipt/latest was observed.
- `github_upload_gate_blocked`: real upload is blocked by policy/gate.

## Hosted evidence is not approval

GitHub-hosted RoundPacks, review zips, receipts, latest JSON, workflow logs, and validation outputs are hosted evidence only. They are not merge approval, install approval, production release, browser profile approval, GitHub upload approval, or Auto Continue live-adapter approval.

## Follow-up: per-button DOM marker/counter contract

Each OpenPatch RE button MUST expose local, machine-readable DOM attributes so Codex and other agents do not depend on whole-page button counts under ChatGPT lazy loading.

Required DOM attributes on `.openpatch-inline-button`:

```text
data-openpatch-re-button-id
data-openpatch-re-button-index
data-openpatch-re-visible-count
data-openpatch-re-message-id
data-openpatch-re-asset-kind
data-openpatch-re-route-decision
data-openpatch-re-allowed-action
data-openpatch-re-not-approval
```

Implemented additional local disambiguators:

```text
data-openpatch-re-message-button-index
data-openpatch-re-message-visible-count
data-openpatch-re-counter-scope
```

Agent interpretation:

- `data-openpatch-re-visible-count` is a count of currently loaded visible OpenPatch RE buttons, not a full history count.
- `data-openpatch-re-message-id` is the compact loaded-message locator.
- `data-openpatch-re-message-button-index` is the preferred local index when multiple assets/buttons appear in one message.
- `data-openpatch-re-not-approval=true` means archive/review/evidence presence is not owner approval, not merge approval, and not install approval.
- Agents should prefer `button_id` or `message_id + message_button_index` over whole-page count.

Failure states:

- Missing `data-openpatch-re-message-id`: treat marker as incomplete and request refresh.
- `data-openpatch-re-route-decision=unknown_blocked`: do not upload; request explicit file naming/classification.
- `data-openpatch-re-not-approval=true`: do not infer execution/install/merge approval.
