# v6 Multi-page / Multi-browser Reliability Notes

## 已处理

✅ 页面按钮带 `pageSessionId`、`buttonId`、`routeContext`、`targetSummary`。  
✅ Bridge 有统一 latest / status / sha-index / queue / event log。  
✅ queue 支持 enqueue / claim / retry / complete / fail。  
✅ `/agent/summary` 给 Codex 和其他 agent 一个低 token 总览。  
✅ `/receipt` 可按 project+round 查具体归档结果。  
✅ `/events` 可排查多页面错序与失败。

## 仍要继续增强

⬜ 实际多浏览器同时上传时，需要进一步压测 latest 更新顺序。  
⬜ 应增加 route profile conflict report：多个 profile 同分时提醒。  
⬜ 应增加 long-running upload timeout 和 resumable retry。  
⬜ 应增加 UI 层 bridge badge：route / key_alias / repo_alias / queue / latest。  
⬜ 应支持每个浏览器 profile 的 instance_id，方便区分多浏览器来源。

## 性能原则

1. 页面 marker 保持短，不塞完整 manifest。  
2. 大文件 hash 与上传由 bridge 做，页面只保留状态。  
3. MutationObserver 使用 requestAnimationFrame 批处理。  
4. latest / status / event log 由本地 bridge 统一写入，避免多个页面互相覆盖。  
5. Codex 默认读 `/agent/summary`，不要读完整事件日志或 transcript。
