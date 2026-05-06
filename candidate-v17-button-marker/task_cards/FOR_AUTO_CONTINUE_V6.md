# FOR_AUTO_CONTINUE_V6

目标：把 Auto Continue 与 OPENPATCH v6 通过事件 API 轻量联动。

新增行为：

✅ 每 N 轮调用 `openpatch:api:get-roundpack-prompt`。  
✅ 发送返回的 RoundPack prompt。  
✅ 等待 `[ROUND_PACK_READY]` 和附件按钮。  
✅ 调用 `openpatch:api:get-buttons` 找到 fresh + roundpack_archive 按钮。  
✅ 调用 `openpatch:api:trigger-upload`。  
✅ 监听 `openpatch:agent-status`，成功后继续，失败后重试或暂停。  

不要把 GitHub token 放进 Auto Continue。Auto Continue 只做对话节奏和事件触发。
