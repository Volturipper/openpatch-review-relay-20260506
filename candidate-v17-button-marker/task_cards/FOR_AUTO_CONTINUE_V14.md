# FOR_AUTO_CONTINUE_V14

Goal: let Auto Continue ask the bridge before continuing.

Use:

```text
POST /auto-continue/preflight
```

Inputs:

```json
{
  "project": "<project>",
  "message_count": 7,
  "page_url": "<optional>",
  "title": "<optional>"
}
```

Decision:

- If `recommended_agent_action=continue_auto_flow`, continue.
- If `should_request_roundpack=true`, send RoundPack prompt.
- If `should_pause=true`, pause until receipt/status is clear.

Do not make Auto Continue manage GitHub tokens. It should call bridge APIs and react to status.
