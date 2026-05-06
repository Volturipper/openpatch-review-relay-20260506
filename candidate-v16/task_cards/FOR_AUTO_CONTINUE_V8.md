# FOR_AUTO_CONTINUE_V8

Use `auto-continue-integration/roundpack_scheduler_adapter_v8.js` as candidate adapter.

Expected behavior:

✅ Ask OpenPatch compact-summary before continuing.
✅ Every configured interval, request RoundPack prompt.
✅ Detect `[ROUND_PACK_READY]` marker.
✅ Trigger archive by page event.
✅ Wait for archive receipt or timeout.
✅ Do not store GitHub keys in Auto Continue.

The adapter is intentionally small and should be wired into the current live Auto Continue controller rather than replacing unrelated script logic.
