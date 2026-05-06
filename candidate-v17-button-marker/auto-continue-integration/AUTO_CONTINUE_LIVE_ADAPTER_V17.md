# AUTO_CONTINUE_LIVE_ADAPTER_V17

Status: design/live-adapter handoff only; not installed by this candidate.

Auto Continue should use OpenPatch RE v17 as a nearby control/feedback layer:

1. Before continuing, query `openpatch:api:get-buttons` and bridge `/auto-continue/preflight`.
2. If the round interval is reached, request a RoundPack and wait for `[ROUND_PACK_READY]`.
3. If a candidate/review/evidence archive appears, require marker fields:
   - `asset_kind`
   - `route_decision`
   - `allowed_action`
   - `not_approval=true`
4. Stop if a required upload receipt is missing after an archive action.
5. Continue only after receipt/latest/status is visible or explicitly skipped by owner.

Receipt-missing stop condition:

```text
If marker status is uploaded but no upload_receipt/latest can be read from bridge or ledger within the configured wait window, pause Auto Continue and report receipt_missing.
```
