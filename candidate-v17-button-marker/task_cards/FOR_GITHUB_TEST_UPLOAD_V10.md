# FOR_GITHUB_TEST_UPLOAD_V10

Purpose: one-repo archive-only smoke test after v10 review.

Setup:
- Create one temporary GitHub archive repo.
- Create one fine-grained PAT scoped only to that repo.
- Configure one `repo_alias` and one `key_alias` in Local Bridge.
- Use one test `webai-roundpack.zip`.

Before upload:
- Run `routes-visual`.
- Run `routes-fix-suggestions`.
- Confirm no blocking conflict.

After upload:
- Capture `upload_receipt.json`.
- Capture `latest.json`.
- Confirm no apply/execute workflow was triggered.
