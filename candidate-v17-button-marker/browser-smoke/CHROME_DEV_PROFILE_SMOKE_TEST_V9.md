# Chrome Dev Profile Smoke Test V9

目标：在专用 Chrome Dev profile 加载 unpacked 插件，检查 UI/marker/API，不使用真实 token。

步骤：
1. 启动 local bridge，设置 dry-run repo_alias。
2. Chrome Dev 使用专用 profile 加载 `openpatch-main/` unpacked extension。
3. 打开测试 ChatGPT 页面或本地 fixture 页面。
4. 检查按钮旁 marker：`data-openpatch-marker=openpatch.agent_button.v9`。
5. 触发 `openpatch:api:get-route-conflicts`，确认返回 route conflicts 结果。
6. 触发 archive dry-run，确认 receipt/latest 写入 bridge data。

失败即停：
- 页面明显卡顿。
- marker 丢失 project/repo_alias/key_alias。
- routeConflictHint 长期 unknown 且 bridge 已可用。
- dry-run 后没有 receipt/latest。
