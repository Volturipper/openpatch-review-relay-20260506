# FOR_AUTO_CONTINUE_V13

Goal: integrate with v13 bridge APIs without embedding GitHub tokens into Auto Continue.

Auto Continue should call or request:

```text
GET /agent/compact-summary?project=<project>
POST /agent/next-action
POST /auto-continue/plan
```

Behavior:

✅ If next-action says `request_roundpack_then_archive`, send the RoundPack prompt and pause until `[ROUND_PACK_READY]`.  
✅ If next-action says `read_latest_receipt`, continue or summarize based on latest receipt.  
✅ If config-lint blocks, surface a short message and do not continue blind.  
✅ Do not manage GitHub tokens.  
✅ Do not upload directly; let OPENPATCH/bridge do that.
