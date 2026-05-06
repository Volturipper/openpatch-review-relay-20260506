# v8 Failure Modes and Prevention

## API key / repo confusion

Use `key_alias` and `repo_alias`, not raw tokens in page scripts. Route profiles should map page/chat context to project/repo/key aliases. The bridge exposes sanitized config status only.

## Many pages uploading at once

Use the bridge queue and receipt system. v8 adds dry-run stress testing and rate-limit backoff to reduce burst failures.

## GitHub API throttling

v8 wraps GitHub API calls with minimum request spacing and retry/backoff. Agents can query `/rate-limit/status` before retrying heavy operations.

## Unbounded event logs

v8 adds event compaction. Agents can call `events-compact` after long Auto Continue runs.

## Oversized accidental uploads

v8 adds bridge-side archive size guard. Large caches, profiles, models, and evidence dumps should not be uploaded through this path.

## Page performance problems

Button marker v8 keeps compact metadata only. Do not put transcript text, file content, large JSON, tokens, or raw URLs into DOM markers.

## Auto Continue runaway loops

The v8 adapter asks for compact summary and can pause when archive/queue work is pending. It should force RoundPack creation at configured intervals and then wait for receipt before continuing.
