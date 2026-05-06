# V10 Agent API Quick Reference

## Bridge APIs
- `GET /routes/visual-map` — compact route graph for agents and UI.
- `POST /routes/visual-map` — route graph plus dynamic page/title/project match context.
- `GET /routes/fix-suggestions` — machine-readable route profile repair hints.
- `POST /routes/fix-suggestions` — repair hints for a specific page context.
- `POST /stress/routes` — simulate many route resolutions.

## Codex CLI
```text
node local-bridge/openpatch-ledger-cli.mjs routes-visual --project webai-transfer --url <chat_url> --title <title>
node local-bridge/openpatch-ledger-cli.mjs routes-fix-suggestions --project webai-transfer
node local-bridge/openpatch-ledger-cli.mjs stress-routes --project webai-transfer --count 200
```

## Page event API
```js
window.dispatchEvent(new CustomEvent('openpatch:api:get-route-visual', {
  detail: { requestId: 'route-viz-1', project: 'webai-transfer' }
}));
window.addEventListener('openpatch:api:route-visual', (event) => console.log(event.detail));
```

## Button marker v10 additions
- `schemaVersion: openpatch.agent_button.v10`
- `routeVisualHint`
- existing fields remain: `routeConflictHint`, `recommendedAgentAction`, `targetSummary`, `bridgeStatusHint`, `queueStatusHint`.
