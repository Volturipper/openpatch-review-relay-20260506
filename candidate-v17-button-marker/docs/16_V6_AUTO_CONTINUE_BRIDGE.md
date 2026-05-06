# v6 Auto Continue Bridge

## 目标

让 ChatGPT Auto Continue 不再只是“继续发送”，而是能在多轮迭代中自动判断何时要求 Web AI 生成 RoundPack、何时暂停等待归档、何时根据 receipt 继续下一轮。

## 推荐流程

```text
Auto Continue 统计本页面轮次 / token 压力 / 阶段完成状态
  ↓
调用 openpatch:api:get-roundpack-prompt 或 bridge /auto-continue/plan
  ↓
向 Web AI 发送 RoundPack prompt
  ↓
等待 [ROUND_PACK_READY] marker 和 webai-roundpack.zip 附件
  ↓
调用 openpatch:api:trigger-upload
  ↓
监听 openpatch:agent-status，直到 uploaded / failed
  ↓
成功：继续下一轮或转交 Codex
失败：重试、查 receipt、或提示 owner
```

## Auto Continue 应新增状态

```json
{
  "roundpack_required": false,
  "roundpack_interval": 5,
  "wait_for_roundpack_ready_marker": true,
  "wait_for_archive_receipt": true,
  "last_archive_status": "unknown",
  "last_openpatch_button_id": ""
}
```

## 何时请求 RoundPack

✅ 每 N 轮。  
✅ 上下文接近变长。  
✅ 出现候选包/审核包/证据包。  
✅ 用户说“打包”“交接”“审核”“给 Codex”。  
✅ 页面要切换角色或项目。  

## 何时继续

✅ 收到 `openpatch:agent-status` 且 `status=uploaded`。  
✅ bridge `/agent/summary` 显示 latest 已更新。  
✅ `recommendedAgentAction` 为 `read_latest_or_trigger_next_auto_continue`。  

## 何时停

⚠️ 附件未出现。  
⚠️ marker stale。  
⚠️ route unresolved。  
⚠️ upload failed 且 retry 后仍失败。  
⚠️ 同一 SHA 重复但本轮声称有新内容，需要人工或审核者判断。
