# FOR_AUTO_CONTINUE

Use page events, not screenshots.

Flow:

```text
1. dispatch openpatch:api:set-route-context
2. ask Web AI for webai-roundpack.zip
3. dispatch openpatch:api:get-buttons
4. select fresh button with mode=roundpack_archive
5. dispatch openpatch:api:trigger-upload with buttonId
6. wait for openpatch:agent-status uploaded/failed
```
