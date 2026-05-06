# FOR AUTO CONTINUE - V15 Integration Note

Auto Continue 可在继续前调用：

```text
operation-brief --project <project> --intent auto-continue
```

若返回：

```text
should_pause_auto=true
```

则暂停自动继续，并请求 Web AI 生成 RoundPack。

若返回：

```text
can_continue_auto=true
```

则可以继续下一轮。

不要让 Auto Continue 管理 GitHub token；它只调用 operation brief / auto-continue preflight / 页面事件。
