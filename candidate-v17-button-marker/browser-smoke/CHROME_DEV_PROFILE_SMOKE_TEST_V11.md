# Chrome Dev Profile Smoke Test V11

Goal: verify unpacked extension loads and exposes v11 agent markers.

Expected evidence:
- Extension loaded in dedicated Chrome Dev profile.
- `openpatch:api:get-buttons` returns buttons with `schemaVersion=openpatch.agent_button.v11`.
- Button has status badge and route/smoke hints.
- No real upload is required for this smoke.
