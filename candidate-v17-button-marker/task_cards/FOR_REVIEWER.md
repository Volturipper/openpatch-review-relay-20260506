# FOR_REVIEWER

Review target:

```text
PATCH_FROM_V2_TO_V3.diff
openpatch-main/src/content-script.js
openpatch-main/src/uploader.js
openpatch-main/src/utils.js
openpatch-main/src/background.js
local-bridge/openpatch-local-bridge.mjs
```

Focus:

```text
P0: syntax/runtime breakage, accidental token exposure, wrong upload path, latest overwrite risk
P1: route profile ambiguity, stale button trigger, queue/retry gaps, bridge receipt correctness
P2: UI wording, schema polish, future validation workflow
```
