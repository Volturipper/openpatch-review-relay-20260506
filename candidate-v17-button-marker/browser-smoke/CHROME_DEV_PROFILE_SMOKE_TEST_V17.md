# Chrome Dev Profile Smoke Test V17

Purpose: observe-only controlled smoke for OpenPatch RE v17. This checks extension loading, DOM marker fields, page events, and bridge visibility. It does not perform real GitHub upload/apply.

Allowed now:
- Load unpacked extension in an isolated Chrome Dev profile.
- Observe ChatGPT page DOM and OpenPatch RE markers.
- Trigger page event queries such as `openpatch:api:get-buttons`.
- Query local bridge health/preflight if bridge is running.

Still blocked unless separately approved:
- Real GitHub upload.
- Auto Continue live adapter install.
- Production profile install.
- Patch/apply workflow execution.

Expected v17 marker fields:
- `schemaVersion = openpatch.agent_button.v17`
- `asset_kind`
- `route_decision`
- `route_decision_reason`
- `allowed_action`
- `not_approval = true` for archive/review/candidate/evidence assets

Stop if:
- A generic unknown `.zip` marker reports upload allowed.
- A review/evidence archive marker implies owner approval.
- The page or bridge prints secrets, PATs, cookies, `.env`, or browser profile internals.
