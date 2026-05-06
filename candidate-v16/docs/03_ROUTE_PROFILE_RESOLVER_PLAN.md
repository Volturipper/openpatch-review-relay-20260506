# Route Profile Resolver Plan

## Need

The user may run many ChatGPT/Web AI pages across multiple browsers and profiles. Each route may need a different repo, key alias, project, branch, and archive root.

## v3 fields already available

✅ `project`
✅ `routeId`
✅ `routeProfile`
✅ `repoAlias`
✅ `keyAlias`
✅ `browserProfile`
✅ `actorHint`
✅ `roundId`
✅ `mode`

## Next resolver behavior

⬜ Match by page URL/chat ID when available.
⬜ Match by window/browser profile hint.
⬜ Match by DOM marker such as `[RELAY_SOURCE_TEXT]`, `[ROUND_PACK_READY]`, or project title.
⬜ Fall back to user-selected profile.
⬜ Persist last route profile per page session.

## Mistake prevention

✅ Buttons expose route context in `data-openpatch-*` attributes.
⬜ Add visible compact route badge next to button.
⬜ Warn if route context is empty while many route profiles exist.
⬜ Warn if a stale button is triggered.
