# Auto Continue Live Adapter V9

目标：让 Auto Continue 在多轮生成时知道什么时候要求 RoundPack、什么时候暂停等归档、什么时候继续。

接入点：
- 每 N 轮调用 `openpatch:api:get-compact-summary`。
- 需要归档时调用 `openpatch:api:get-roundpack-prompt`，把 prompt 发给 Web AI。
- 检测 `[ROUND_PACK_READY]` marker 后调用 `openpatch:api:get-buttons`。
- 若按钮 `routeConflictHint=clear|warnings`，可触发 `openpatch:api:trigger-upload`。
- 若 `ambiguous|blocking_conflict`，先调用 `openpatch:api:get-route-conflicts` 并暂停。

不要把 GitHub token 放进 Auto Continue；Auto Continue 只驱动页面和读取状态。
