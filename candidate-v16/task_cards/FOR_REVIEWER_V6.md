# FOR_REVIEWER_V6

请作为外部审查者 fast-track 审查 v6 候选包：

P0：是否引入真实 token 泄露、远程任意控制、本地越权、路径越界。  
P1：页面事件 API、bridge API、Codex CLI 是否足够清晰且可测试。  
P1：多页面 queue/receipt/latest/sha-index 是否有明显并发与误判风险。  
P2：文档、schema、task card 是否足够让下一轮 Codex 小步验证。  

输出：go/no-go、P0/P1/P2、最小修复建议、是否建议进入真实 Chrome Dev profile smoke test。
