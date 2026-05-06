# V10 Multi-Browser / Multi-Page Prevention Notes

## Main risk
With many pages and keys, a wrong upload route is more costly than a failed upload. The bridge must expose route decisions before upload.

## Recommended operating pattern
1. Each browser/profile/chat group has a `route_profile`.
2. Each route profile points to `project`, `repo_alias`, `key_alias`, `browser_profile`, and `chat_group`.
3. Agents query `routes-visual` and `routes-fix-suggestions` before enabling unattended archive runs.
4. Auto Continue should pause if marker says `routeConflictHint=ambiguous` or `routeVisualHint` recommends a route fix.
5. Codex can run `stress-routes --count 200` after route profile changes.

## Practical next step
Run isolated Chrome Dev profile smoke with v10 loaded unpacked, then test one GitHub archive repo using a fine-grained PAT with minimal scope.
