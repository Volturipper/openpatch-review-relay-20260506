# Designer Feedback: v18 Task for OpenPatch RE Button Markers

## Current decision

v17 button-marker candidate is ready for one controlled observe-only smoke, but not production release.

Allowed now:

- Chrome/CDP observe-only marker inspection.
- Bridge-only dry-run if no real upload/apply path is triggered.

Still blocked:

- Real GitHub upload/apply.
- Production install.
- Live Auto Continue adapter install/control.
- Any use or exposure of secrets, PATs, cookies, browser profile internals, or .env content.

## Required v18 fixes

### P1: Fix stale root entry

Update `candidate-v17-button-marker/README.md` and future package root README text:

- Say `OpenPatch RE v17 button-marker candidate`, not v16.
- Say marker schema is `openpatch.agent_button.v17`, not v16.
- Keep the hosted-evidence-is-not-approval warning.

### P1: Replace string-only button marker self-test

Add a runtime DOM fixture test that proves actual marker behavior, not just source strings.

Minimum acceptance:

- Create a DOM with at least two message scopes.
- Attach at least two `.openpatch-inline-button` elements in one message and one in another.
- Run the same counter/marker path used by production code, or expose a testable helper.
- Assert actual `button.dataset.openpatchRe*` values.
- Assert `message_button_index` is message-local.
- Assert `visible_count` is loaded-DOM-only and never treated as full history.
- Assert unknown `.zip` has `route_decision=unknown_blocked`, `allowed_action=none`, and `not_approval=true`.
- Ensure every `passed` field in results is a boolean.

### P1: Tighten the v17 marker schema

In `schemas/openpatch.agent_button.v17.schema.json`, add stricter constraints:

- `schemaVersion`: const `openpatch.agent_button.v17`.
- `status`: enum `ready`, `blocked`, `capturing`, `uploading`, `uploaded`, `failed`, `stale`, `unknown`.
- `asset_kind`: enum matching the route classifier vocabulary.
- `route_decision`: enum `patch_upload_allowed`, `archive_allowed`, `unknown_blocked`.
- `allowed_action`: enum `upload_openpatch_content`, `archive_roundpack_content`, `none`.
- `not_approval`: boolean.
- `counter_scope`: const or enum including `loaded_dom_and_current_message`.
- Add semantic rule: if `asset_kind` is review/archive/candidate/evidence/unknown_zip, `not_approval` must be true.
- Add semantic rule: if `route_decision=unknown_blocked`, `allowed_action=none` and `canUpload=false`.

### P2: Add smoke evidence template

Add `checks/V18_BUTTON_MARKER_CONTROLLED_SMOKE_EXPECTED.json` or equivalent with expected fields:

- `button_count_loaded_dom`
- `buttons[].button_id`
- `buttons[].message_id`
- `buttons[].message_button_index`
- `buttons[].message_visible_count`
- `buttons[].asset_kind`
- `buttons[].route_decision`
- `buttons[].allowed_action`
- `buttons[].not_approval`
- `buttons[].counter_scope`
- `no_upload_clicked=true`
- `github_upload_apply_allowed=false`
- `live_auto_continue_allowed=false`

## Stop doing

- Do not claim real Chrome, GitHub upload/apply, production install, or live Auto Continue success from source-string tests.
- Do not let root README lag behind the candidate generation.
- Do not let schemas accept arbitrary route/approval strings once the controlled smoke path depends on them.
