# Auto Continue Integration

## Desired behavior

ChatGPT Auto Continue should help generate and archive RoundPacks without managing GitHub secrets directly.

## v3-compatible flow

1. Auto Continue sets route context via `openpatch:api:set-route-context`.
2. Auto Continue asks Web AI to generate `webai-roundpack.zip`.
3. OPENPATCH creates a marker button next to the file.
4. Auto Continue queries buttons with `openpatch:api:get-buttons`.
5. Auto Continue triggers the button with `openpatch:api:trigger-upload` when appropriate.
6. OPENPATCH emits `openpatch:agent-status` with uploaded/failed state.
7. Auto Continue pauses/continues based on receipt status.

## Performance rule

Auto Continue should read marker JSON and short events, not scrape huge DOM or request screenshots.
