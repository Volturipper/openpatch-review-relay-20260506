# Codex Controlled Smoke Evidence Instructions - OpenPatch RE v17

Scope allowed now:

- bridge-only dry-run smoke
- Chrome/CDP observe-only marker/API smoke

Blocked:

- real GitHub upload/apply
- production install
- live Auto Continue adapter install
- secrets/PAT/cookie/.env/browser-profile exposure

## Evidence packet format

Return a compact JSON or Markdown evidence packet with:

1. `commands`: exact command(s) or CDP observe-only step(s).
2. `no_secrets_statement`: confirm no secrets/PATs/cookies/.env/browser profile internals were read or printed.
3. `marker_summary`: include sample button marker fields:
   - `data-openpatch-re-button-id`
   - `data-openpatch-re-button-index`
   - `data-openpatch-re-visible-count`
   - `data-openpatch-re-message-id` or compact message hash
   - `data-openpatch-re-asset-kind`
   - `data-openpatch-re-route-decision`
   - `data-openpatch-re-allowed-action`
   - `data-openpatch-re-not-approval`
4. `api_summary`: relevant page event/API result if observed.
5. `dry_run_receipt`: bridge-only receipt/result, if applicable.
6. `failures`: exact failure list, or empty list.
7. `next_action_recommendation`: reviewer audit, continue controlled smoke, or blocked.

## Success criteria

- A loaded message can be inspected without relying on whole-page historical button counts.
- Every sampled OpenPatch RE button has local DOM marker metadata.
- `not_approval=true` is visible for archive/review evidence assets.
- Unknown/generic `.zip` remains blocked by route/asset classification unless explicitly classified.
- No real GitHub upload/apply occurs.
