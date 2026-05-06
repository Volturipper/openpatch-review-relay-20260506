# OpenPatch RE v17 Button Marker Review Report

## Verdict

`ready_for_controlled_smoke`

Allowed scope is narrow: Chrome/CDP observe-only marker inspection and bridge-only dry-run. Real GitHub upload/apply, production install, and live Auto Continue remain blocked.

## What was reviewed

- Repository: `Volturipper/openpatch-review-relay-20260506`
- Commit: `3edbd489e6f67201455ef92e0996acc358e3b776`
- Candidate tree: `candidate-v17-button-marker/`
- Candidate zip SHA256: `708d66e12c1094821a89418a8aace4508733de11a3983ba5107ca18a545073a8`
- Review mode: GitHub-only hosted tree review.

## Findings

### PASS: per-button DOM fields are implemented in code

`openpatch-main/src/content-script.js` contains actual DOM dataset writes for the requested fields:

- `data-openpatch-re-button-id`
- `data-openpatch-re-button-index`
- `data-openpatch-re-visible-count`
- `data-openpatch-re-message-id`
- `data-openpatch-re-message-button-index`
- `data-openpatch-re-message-visible-count`
- `data-openpatch-re-counter-scope`
- `data-openpatch-re-asset-kind`
- `data-openpatch-re-route-decision`
- `data-openpatch-re-allowed-action`
- `data-openpatch-re-not-approval`

The implementation also refreshes counters through `refreshVisibleButtonCounters()` before returning current markers.

### PASS: lazy-loading risk is addressed conceptually

The candidate does not claim whole-page history counts. It defines:

- `button_index` and `visible_count` as loaded-DOM counters.
- `message_id`, `message_button_index`, and `message_visible_count` as local disambiguators.
- `counter_scope = loaded_dom_and_current_message`.

This is appropriate for ChatGPT lazy loading, provided agents treat these as local loaded-message locators.

### PASS: route-safety gates remain in place

The classifier still distinguishes:

- exact `changed-files.zip` -> patch upload candidate
- `openpatch.diff` / `.patch` -> patch upload candidate
- RoundPack/review/audit/evidence/candidate archives -> archive allowed, `not_approval=true`
- unknown `.zip` -> `unknown_blocked`, `allowed_action=none`, `canUpload=false`

This supports a controlled observe-only smoke without allowing real apply.

### ISSUE: self-test is not enough for release confidence

The button-marker self-test is mostly source-string matching. It confirms strings exist in source, but it does not instantiate a DOM, attach buttons, dispatch page events, or validate the marker JSON against a strict schema.

Also, several `passed` fields in `V17_BUTTON_MARKER_COUNTER_RESULTS.json` are schema property objects rather than strict booleans. This does not block observe-only smoke, but it must be fixed before stronger claims.

### ISSUE: schema is too permissive

`schemas/openpatch.agent_button.v17.schema.json` requires the new fields, but leaves important safety fields as plain strings and permits additional properties. v18 should add enums/consts for route and approval semantics.

### ISSUE: root README is stale

`candidate-v17-button-marker/README.md` still says `OPENPATCH Agent Gateway v16 Candidate` and says marker upgraded to `openpatch.agent_button.v16`. This should be fixed before the next package so Codex does not follow stale entry text.

## Decision

Proceed to one controlled observe-only smoke. Do not proceed to real upload/apply, production install, or live Auto Continue.
