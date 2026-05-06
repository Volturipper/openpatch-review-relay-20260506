# FOR_GITHUB_TEST_UPLOAD_V14

Goal: prepare for one archive-only upload to a test GitHub repo.

First command:

```bash
node local-bridge/openpatch-ledger-cli.mjs github-upload-gate --project openpatch-smoke
```

Proceed only if:

```text
gate = go or go_with_warnings
can_upload = true
repo_alias points to a test archive repo
key_alias points to a fine-grained PAT for that single repo
```

Evidence to return:

```text
upload_gate JSON
archive receipt JSON
latest JSON
GitHub commit/path result if real upload was performed
```

Do not use production repos or broad-scope tokens for first smoke.
