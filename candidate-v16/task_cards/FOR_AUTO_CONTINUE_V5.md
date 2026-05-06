# FOR AUTO CONTINUE — v5 integration

Use OpenPatch as a RoundPack archival gateway.

Preferred loop:

```text
1. Auto Continue decides a RoundPack is needed.
2. It asks Web AI to generate `webai-roundpack.zip`.
3. OpenPatch button marker detects the file.
4. OpenPatch sends file + route context to Local Bridge.
5. Local Bridge archives/dry-runs and returns receipt/latest.
6. Auto Continue reads `openpatch:agent-status` / button marker status and continues or pauses.
```

Do not store GitHub tokens in Auto Continue. Use bridge aliases.
