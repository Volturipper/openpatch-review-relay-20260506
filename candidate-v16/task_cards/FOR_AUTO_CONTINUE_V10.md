# FOR_AUTO_CONTINUE_V10

Auto Continue should use v10 marker/API as follows:

1. Before requesting unattended archive/upload, call `openpatch:api:get-route-visual`.
2. Read each button marker: `routeConflictHint`, `routeVisualHint`, `recommendedAgentAction`, `targetSummary`.
3. If route is ambiguous, ask Web AI to produce RoundPack but pause upload until route context is set.
4. If route is clear, continue normal RoundPack Scheduler flow.
5. Do not print large marker JSON in chat; use compact status only.
