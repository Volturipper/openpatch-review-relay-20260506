# OpenPatch Review Relay 20260506

Temporary public relay repository for OpenPatch Agent Gateway v16 review.

This repository is used as hosted evidence and artifact storage only. Files here are not assumed to be merged into D:/Codex/n8n-gpt-orchestrator.

## Candidate

- Candidate: openpatch_agent_gateway_v16_candidate.zip
- Expected SHA256: d7cfcf2a5099498bc9d8003569212da5551558c0b5c4601ff175efde600ae699
- Source designer page: https://chatgpt.com/c/69fa7008-3598-83a2-8a3a-042e4563012e
- Reviewer page: https://chatgpt.com/c/69fb0e48-26dc-83aa-b036-33c26f6cc582
- Baseline only, not latest: https://github.com/afumu/openpatch

## Required Reviewer Output

Return file-oriented artifacts. Preferred downloadable file: openpatch_review_round_1_result.zip.

If attachment generation is unavailable, start with NO_ATTACHMENT and provide fenced code blocks for each required file name.

Required files:

- README.md
- openpatch-review-report-round-1.md
- openpatch-review-decision-round-1.json
- openpatch-review-required-designer-changes-round-1.md
- openpatch-review-minimal-smoke-plan-round-1.md

## Receive Routes

Codex will receive the result in two ways:

- Local route: download the ChatGPT attachment or parse NO_ATTACHMENT fenced files, then register locally with ASSET_RECEIVER.
- GitHub route: store the same result under review-results/round-1/ in this repository for durable hosted evidence.
