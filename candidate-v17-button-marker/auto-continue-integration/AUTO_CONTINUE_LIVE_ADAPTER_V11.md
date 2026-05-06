# Auto Continue Live Adapter V11

Integrate as a small adapter, not a hard merge.

Auto Continue should:
- Ask bridge `/agent/compact-summary` before continuing.
- Ask `/smoke/plan` or `/auto-continue/plan` when a roundpack is due.
- Send RoundPack prompt and wait for `[ROUND_PACK_READY]`.
- Listen for OpenPatch receipt/status event.
- Continue only after receipt or clear retry/failure state.

Auto Continue should not store GitHub tokens.
