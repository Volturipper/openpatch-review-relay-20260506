# FOR_AUTO_CONTINUE_V7

Goal: integrate `auto-continue-integration/roundpack_scheduler_adapter.js` as a small adapter, not a full rewrite.

Expected behavior:

✅ Every N rounds, request RoundPack prompt through OpenPatch page event.  
✅ Wait for `[ROUND_PACK_READY]`.  
✅ Trigger OpenPatch upload for `webai-roundpack.zip`.  
✅ Wait for `openpatch:agent-status` uploaded marker before continuing.  
✅ Do not store GitHub token in Auto Continue.

Evidence: Auto Continue state JSON with messageCount, waitingForRoundPack, lastRoundPackMarker, lastArchiveReceipt.
