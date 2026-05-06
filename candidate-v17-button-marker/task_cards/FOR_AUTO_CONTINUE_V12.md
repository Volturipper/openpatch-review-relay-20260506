# FOR_AUTO_CONTINUE_V12

## 目标

Auto Continue 在每 N 轮询问 bridge 的 compact/readiness 状态，然后决定继续、请求 RoundPack、暂停等。

## 推荐逻辑

✅ 继续前先查 `/agent/compact-summary` 或 `/readiness`。  
✅ 到达 interval 时请求 Web AI 生成 RoundPack。  
✅ 等待 `[ROUND_PACK_READY]` marker 和 OpenPatch receipt。  
✅ 如果 route conflict 或 readiness no_go，则暂停并提示 owner/Codex。  
✅ Auto Continue 不保存 GitHub token。

## 需要读取

```text
openpatch:api:get-agent-summary
openpatch:api:get-buttons
openpatch:agent-status
openpatch:api:trigger-upload
```

## 成功标准

Auto Continue 能在不读长聊天、不读取 key 的情况下判断：继续、产包、上传、等待 receipt、暂停。
