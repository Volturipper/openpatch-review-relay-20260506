# v12 Real Smoke Gate

## 推荐顺序

✅ Bridge-only smoke  
⬜ Chrome Dev profile smoke  
⬜ GitHub test repo archive-only smoke  
⬜ Auto Continue live adapter smoke

## Bridge-only smoke 进入条件

✅ `health.ok=true`  
✅ `config-lint.errors=[]`  
✅ `/readiness.go_no_go` 为 `go` 或 `go_with_warnings`  
✅ smoke 只用 dry-run archive，不接真实 token

## Chrome smoke 进入条件

✅ Bridge-only smoke 已回传 evidence。  
✅ 使用专用 Chrome Dev profile。  
✅ marker 为 `openpatch.agent_button.v12`。  
✅ 不触发真实 GitHub 上传。

## GitHub test upload 进入条件

✅ Chrome smoke 已通过。  
✅ 只用单测试仓 fine-grained PAT。  
✅ repo_alias/key_alias 已配置且 `config-lint.errors=[]`。  
✅ 上传目标是 archive-only 路径，不是主项目 apply 路径。

## Auto Continue smoke 进入条件

✅ RoundPack prompt / marker / receipt 逻辑已在插件和 bridge 中可查询。  
✅ Auto Continue 只触发 RoundPack 生成和 archive request，不保存 GitHub token。

## 不放行项

❌ 真实主仓库写入。  
❌ main/master 自动 apply。  
❌ 在聊天正文输出 token/key。  
❌ 把插件前端变成多 key 管理中心。  
❌ 不带 receipt/result 的上传。
