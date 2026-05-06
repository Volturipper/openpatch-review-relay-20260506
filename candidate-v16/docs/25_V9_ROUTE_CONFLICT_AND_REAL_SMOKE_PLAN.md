# V9 Route Conflict + Real Smoke Plan

## 为什么要做

多页面、多浏览器、多 key、多仓库时，真正高频风险不是上传 API 本身，而是 route profile 误匹配：设计者页面、审核者页面、不同项目页面可能把同名 RoundPack 传到错误仓库或错误分支。

## V9 处理方式

- 静态检查 duplicate profile id、多个 default、缺 repo_alias/key_alias、同 project 同匹配指纹。
- 动态检查当前页面 URL/title/project_hint 的 top route candidates。
- 若 top 与 second 分数差距小于 `OPENPATCH_ROUTE_AMBIGUITY_GAP`，返回 ambiguous。
- 按钮 marker 写入 `routeConflictHint`，让 Auto Continue 或 Codex 直接决策。

## 真实 smoke 顺序

1. 只启动 local bridge，跑 `routes-conflicts`。
2. Chrome Dev profile 加载 unpacked 插件。
3. 打开一个测试 ChatGPT 页面，检查按钮 marker。
4. 使用 dry-run archive。
5. 使用单测试仓 fine-grained PAT 做真实上传。
6. Codex 读取 latest/receipt，不读完整 transcript。
