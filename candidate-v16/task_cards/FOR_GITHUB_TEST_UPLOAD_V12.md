# FOR_GITHUB_TEST_UPLOAD_V12

## 目标

在 bridge-only smoke 和 Chrome smoke 通过后，使用单测试仓 fine-grained PAT 做 archive-only 上传。

## 前置条件

✅ `readiness --target github` 不是 `no_go`。  
✅ token 只在本地 bridge 环境或 token 文件中，不进前端页面。  
✅ repo_alias 指向测试仓。  
✅ branch 是 archive/staging 分支。  
✅ 上传只生成 receipt/latest/result，不 apply 项目代码。

## 交付

```text
github_upload_receipt.json
latest.json
validate_result.json 或 workflow log 摘要
SHA256SUMS.txt
```

## 停止条件

⚠️ 目标仓库不是测试仓。  
⚠️ 目标分支是 main/master。  
⚠️ 输出中出现 token。  
⚠️ 任何 workflow 尝试 apply/merge 代码。
