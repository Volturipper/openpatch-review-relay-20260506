# FOR_GITHUB_TEST_UPLOAD_V9

目标：单测试仓 archive-only 真实上传，不接主项目。

准备：
✅ 一个空 GitHub 测试仓库。  
✅ 一个 fine-grained PAT，只授予该测试仓 Contents read/write。  
✅ repo_alias 指向测试仓；key_alias 指向本地环境变量。  
✅ bridgeHandlesUpload=true。

测试动作：
1. 生成极小 `webai-roundpack-test.zip`。
2. 调用 bridge `/archive/base64`，非 dry-run。
3. 查询 `/latest?project=<project>` 与 `/receipt`。
4. 检查 GitHub 仓库是否出现 roundpack、manifest、receipt、latest。

成功标准：
✅ 不触发 apply。  
✅ 不写主项目。  
✅ receipt 包含 file_sha256/github paths。  
✅ Codex 可用 CLI 读取 latest/receipt。
