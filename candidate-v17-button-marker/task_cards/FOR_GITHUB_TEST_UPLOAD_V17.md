# FOR_GITHUB_TEST_UPLOAD_V17

Status: blocked until owner grants one-run action-time approval for a single test repo/fine-grained PAT.

Use only after v17 bridge-only dry-run and Chrome/CDP observe-only smoke pass.

Preflight command:

```text
node local-bridge/openpatch-ledger-cli.mjs github-upload-gate --project <project> --url <page_url> --title <page_title>
```

Proceed only if `gate` is `go` or explicitly accepted `go_with_warnings`, route is not ambiguous, repo_alias/key_alias match the intended test repo, and upload is archive-only.

Do not claim real upload success without receipt/latest evidence from the archive repo.
