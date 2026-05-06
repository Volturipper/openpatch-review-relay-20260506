(function () {
  const BUTTON_CLASS = "openpatch-inline-button";
  const TOOLBAR_ID = "openpatch-floating-toolbar";
  const TOAST_ID = "openpatch-toast";
  const CAPTURE_EVENT = "openpatch:capture-next-download";
  const CAPTURE_RESPONSE_SOURCE = "openpatch-page-bridge";
  const AGENT_MARKER_CLASS = "openpatch-agent-marker";
  const AGENT_STATUS_EVENT = "openpatch:agent-status";
  const AGENT_BUTTONS_REQUEST_EVENT = "openpatch:api:get-buttons";
  const AGENT_BUTTONS_RESPONSE_EVENT = "openpatch:api:buttons";
  const AGENT_STATUS_REQUEST_EVENT = "openpatch:api:get-runtime-status";
  const AGENT_STATUS_RESPONSE_EVENT = "openpatch:api:runtime-status";
  const AGENT_ROUTE_CONTEXT_EVENT = "openpatch:api:set-route-context";
  const AGENT_ARCHIVE_REQUEST_EVENT = "openpatch:api:request-archive";
  const AGENT_ARCHIVE_RESPONSE_EVENT = "openpatch:api:archive-requested";
  const AGENT_TRIGGER_UPLOAD_EVENT = "openpatch:api:trigger-upload";
  const AGENT_TRIGGER_UPLOAD_RESPONSE_EVENT = "openpatch:api:trigger-upload-result";
  const AGENT_RESOLVE_ROUTE_EVENT = "openpatch:api:resolve-route";
  const AGENT_RESOLVE_ROUTE_RESPONSE_EVENT = "openpatch:api:resolve-route-result";
  const AGENT_BRIDGE_STATUS_EVENT = "openpatch:api:get-bridge-status";
  const AGENT_BRIDGE_STATUS_RESPONSE_EVENT = "openpatch:api:bridge-status";
  const AGENT_ROUNDPACK_PROMPT_EVENT = "openpatch:api:get-roundpack-prompt";
  const AGENT_ROUNDPACK_PROMPT_RESPONSE_EVENT = "openpatch:api:roundpack-prompt";
  const AGENT_AGENT_SUMMARY_EVENT = "openpatch:api:get-agent-summary";
  const AGENT_AGENT_SUMMARY_RESPONSE_EVENT = "openpatch:api:agent-summary";
  const AGENT_COMPACT_SUMMARY_EVENT = "openpatch:api:get-compact-summary";
  const AGENT_COMPACT_SUMMARY_RESPONSE_EVENT = "openpatch:api:compact-summary";
  const AGENT_ROUTE_CONFLICTS_EVENT = "openpatch:api:get-route-conflicts";
  const AGENT_ROUTE_CONFLICTS_RESPONSE_EVENT = "openpatch:api:route-conflicts";
  const AGENT_ROUTE_VISUAL_EVENT = "openpatch:api:get-route-visual";
  const AGENT_ROUTE_VISUAL_RESPONSE_EVENT = "openpatch:api:route-visual";
  const BUTTON_STALE_AFTER_MS = 10 * 60 * 1000;
  const PAGE_SESSION_ID = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  let routeContext = {
    schemaVersion: "openpatch.route_context.v1",
    project: "",
    routeId: "",
    routeProfile: "",
    repoAlias: "",
    keyAlias: "",
    browserProfile: "",
    actorHint: "",
    mode: "auto",
    roundId: "",
    updatedAt: new Date().toISOString()
  };
  let attachScheduled = false;
  const ZIP_PACKAGE_PROMPT = `请为本次代码修改生成一个可下载的 changed-files.zip 文件，并严格遵守以下规则：

1. 请创建并提供一个 changed-files.zip 作为下载附件，不要把文件内容直接粘贴在聊天正文里。
2. 正文只需要简短说明“已生成 changed-files.zip，请下载”，并提供文件下载入口。
3. zip 内只放本次新增或修改后的完整文件，文件内容必须是修改后的最终版本。
4. zip 内路径必须是相对于仓库根目录的真实路径，例如：
   index.html
   style.css
   src/app.js
5. 不要在 zip 里额外包一层项目目录，例如不要使用 snake-game-test/index.html。
6. 不要包含绝对路径、../、.git/、.ai-patches/ 或 .github/workflows/。
7. 如果需要删除文件，在 zip 根目录放一个 .openpatch-delete.txt，每行写一个要删除的仓库相对路径。
8. 不要生成 diff、patch、代码片段、Markdown 代码块或拆分包，只生成一个 changed-files.zip。
9. 必须基于用户当前提供的最新项目文件内容生成 changed-files.zip，不要基于历史对话里的旧版本代码生成。
10. 如果用户已经连续做过多轮修改，必须基于上一轮修改后的完整文件继续生成新的 changed-files.zip。
11. 如果你没有看到某个文件的当前完整内容，请先要求用户提供该文件，或者明确说明无法可靠生成 changed-files.zip。`;



  const ROUNDPACK_PROMPT = `请为本轮 Web AI 工作生成一个可下载的 webai-roundpack.zip 文件，并严格遵守以下规则：

1. 只生成一个 webai-roundpack.zip 附件，不要把文件全文粘贴在聊天正文。
2. zip 根目录必须包含 README.md、ROUND_SUMMARY.md、FULL_TRANSCRIPT.md、NEXT_FOR_CODEX.md、NEXT_FOR_REVIEWER.md、OWNER_DECISION.md、RISK_AND_BOUNDARY.md、FILES_MANIFEST.json、SHA256SUMS.txt。
3. ROUND_SUMMARY.md 用简洁中文说明本轮做了什么、关键结论、生成文件、下一步建议、未完成项。
4. NEXT_FOR_CODEX.md 必须极短，只写 Codex 下一步默认该读什么、做什么、输出什么；不要要求 Codex 读完整 transcript，除非必要。
5. FILES_MANIFEST.json 必须是机器可读 JSON，并包含 round_id、project、source_ai、created_at、purpose、allow_execution=false、files、next_actor、codex_default_read。
6. SHA256SUMS.txt 必须列出包内主要文件和 ARTIFACTS 内附件的 SHA256。
7. ARTIFACTS/ 可放本轮候选包、审核包、证据包或其他附件。
8. 不要包含 secrets、.env、cookies、tokens、浏览器 profile、node_modules、缓存、大模型、ComfyUI models。
9. 本轮包是 archive_only，默认不授权执行、安装、apply、push 或提交真实项目。
10. 聊天正文最后必须输出机器可读 marker：
[ROUND_PACK_READY]
project: <project>
round_id: <round_id>
file_name: webai-roundpack.zip
next_actor: <owner|codex|reviewer|designer>
[/ROUND_PACK_READY]
11. 如果无法生成完整 FULL_TRANSCRIPT.md，请在 README.md 和 FULL_TRANSCRIPT.md 里说明缺失范围，不要假装完整。`;

  const GIT_DIFF_PROMPT = `请为本次代码修改生成一个可下载的 openpatch.diff 文件，并严格遵守以下规则：

1. 你必须先在项目容器里完成实际代码修改，不能手写 diff，不能在聊天正文里直接编造 diff 内容。
2. 修改完成后，必须使用 Git 命令生成标准 diff 文件：

   git status --short
   git add -A
   git diff --cached --binary --full-index --find-renames > openpatch.diff
   git reset
   git apply --check openpatch.diff

3. 如果 git apply --check openpatch.diff 失败，请先修正问题，再重新生成 openpatch.diff。
4. 请把 openpatch.diff 作为下载附件提供，不要把 diff 内容粘贴在聊天正文里。
5. 正文只需要简短说明“已生成 openpatch.diff，请下载”，并提供文件下载入口。
6. diff 必须基于用户当前提供的最新项目文件内容生成，不要基于历史对话里的旧版本代码生成。
7. 如果用户已经连续做过多轮修改，必须基于上一轮修改后的完整代码继续生成新的 openpatch.diff。
8. 如果当前环境不是 Git 仓库，或缺少生成 diff 所需的完整文件，请明确说明原因，并要求用户提供仓库文件或改用 changed-files.zip 方案。
9. 不要生成 zip、代码片段、Markdown 代码块或拆分包，只生成一个 openpatch.diff。`;

  function looksLikePatchDownloadText(text) {
    const value = String(text || "").trim().toLowerCase();
    if (!value) return false;
    if (/\.(tar|gz|rar|7z)\b/i.test(value)) return false;
    return /\.(diff|patch|zip)\b/i.test(value)
      || /\b(diff|patch)\s*(文件|file)?\b/i.test(value)
      || /changed-files\.zip|代码包|文件包|压缩包/i.test(value);
  }



  function looksLikeRoundPackDownloadText(text) {
    const value = String(text || "").trim().toLowerCase();
    if (!value) return false;
    return /round\s*pack|roundpack|webai-roundpack|review-pack|audit-pack|handoff|evidence|receipt|归档|回合包|交接包|审核包|证据包/i.test(value);
  }

  function shouldUseArchiveMode({ fileName, label }) {
    const configured = String(routeContext.mode || "auto").toLowerCase();
    if (configured === "archive_only" || configured === "roundpack_archive") return true;
    if (configured === "patch_upload") return false;
    return looksLikeRoundPackDownloadText(`${fileName || ""} ${label || ""}`);
  }

  function inferPatchName(text) {
    const fileMatch = String(text || "").match(/([\w.-]+\.(?:diff|patch|zip))/i);
    if (fileMatch) return fileMatch[1];

    const cleaned = String(text || "")
      .replace(/上传|下载|整体|补丁|文件|文件包|代码包|轻量|样式|优化|diff|patch|zip/gi, " ")
      .trim()
      .replace(/\s+/g, "-");

    return `${cleaned || "changed-files"}.zip`;
  }

  function createInlineButton(sourceButton) {
    const label = sourceButton.textContent || sourceButton.getAttribute("aria-label") || "";
    const suggestedName = inferPatchName(label);
    const archiveMode = shouldUseArchiveMode({ fileName: suggestedName, label });
    const marker = buildAgentMarker({ sourceButton, suggestedName, label, archiveMode });

    const button = document.createElement("button");
    button.type = "button";
    button.className = BUTTON_CLASS;
    setButtonText(button, archiveMode ? "Archive RoundPack" : "Upload to GitHub");
    button.appendChild(createStatusBadge(marker));
    button.title = archiveMode ? "Archive this attachment as a RoundPack/artifact" : "Read this attachment and upload it to GitHub";
    button.setAttribute("aria-label", archiveMode ? `OpenPatch archive ${suggestedName}` : `OpenPatch upload ${suggestedName}`);
    setButtonMarker(button, marker);

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const currentMarker = button.__openpatchAgentMarker || marker;
      const archiveMode = currentMarker.mode === "roundpack_archive";
      const title = archiveMode
        ? `archive: ${suggestedName}`
        : (suggestedName.toLowerCase().endsWith(".zip")
          ? `ai: apply changed files package ${suggestedName}`
          : `ai: apply ${suggestedName}`);

      button.disabled = true;
      setButtonText(button, "Uploading...");
      setButtonMarker(button, {
        status: "capturing",
        decisionHint: "attachment_read_in_progress",
        action: "upload_openpatch_content"
      });
      showToast("正在读取附件...");

      try {
        const captured = await captureDownloadFromSource({
          sourceButton,
          suggestedName
        });
        const uploadName = captured.fileName || suggestedName;
        setButtonMarker(button, {
          status: "uploading",
          fileName: uploadName,
          extension: getFileExtension(uploadName),
          sourceUrlKind: getUrlKind(captured.url),
          sourceHost: getUrlHost(captured.url),
          decisionHint: archiveMode ? "archive_upload_in_progress" : "github_upload_in_progress"
        });
        showToast("Uploading to GitHub...");

        const response = await chrome.runtime.sendMessage({
          type: archiveMode ? "ARCHIVE_ROUNDPACK_CONTENT" : "UPLOAD_OPENPATCH_CONTENT",
          fileName: uploadName,
          content: captured.content,
          url: captured.url,
          title,
          routeContext: {
            ...sanitizeRouteContext(routeContext),
            pageSessionId: PAGE_SESSION_ID,
            buttonId: currentMarker.buttonId || ""
          }
        });

        if (!response?.ok) {
          throw new Error(response?.error || "上传失败。");
        }

        setButtonMarker(button, {
          status: "uploaded",
          decisionHint: archiveMode ? "archive_complete_check_latest_receipt" : "upload_complete_check_github_feedback",
          recommendedAgentAction: archiveMode ? "read_latest_or_trigger_next_auto_continue" : "check_github_workflow_or_feedback",
          canRetry: "true",
          result: sanitizeUploadResult(response.result)
        });
        showToast(archiveMode ? "Archive complete. Receipt/latest are available." : "Upload complete. The workflow will apply it.");
      } catch (error) {
        setButtonMarker(button, {
          status: "failed",
          decisionHint: "inspect_error_or_retry",
          recommendedAgentAction: "retry_or_read_error_receipt",
          canRetry: "true",
          error: error?.message || "上传失败。"
        });
        showToast(error?.message || "上传失败。");
      } finally {
        button.disabled = false;
        setButtonText(button, archiveMode ? "Archive RoundPack" : "Upload to GitHub");
      }
    });

    return button;
  }

  function getFileExtension(name) {
    const match = String(name || "").match(/\.([a-z0-9]+)$/i);
    return match?.[1]?.toLowerCase() || "";
  }

  function getUrlKind(url) {
    const value = String(url || "");
    if (!value) return "unknown";
    if (value.startsWith("blob:")) return "blob";
    if (value.startsWith("data:")) return "data";
    try {
      return new URL(value).protocol.replace(/:$/, "") || "url";
    } catch {
      return "unknown";
    }
  }

  function getUrlHost(url) {
    try {
      const parsed = new URL(String(url || ""));
      return parsed.hostname || "";
    } catch {
      return "";
    }
  }

  function buildAgentMarker({ sourceButton, suggestedName, label, archiveMode = false }) {
    const href = sourceButton.getAttribute("href") || "";
    return {
      schemaVersion: "openpatch.agent_button.v16",
      marker: "openpatch-inline-upload",
      status: "ready",
      mode: archiveMode ? "roundpack_archive" : "patch_upload",
      action: archiveMode ? "archive_roundpack_content" : "upload_openpatch_content",
      fileName: suggestedName,
      extension: getFileExtension(suggestedName),
      buttonId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      pageSessionId: PAGE_SESSION_ID,
      sourceText: String(label || "").trim().slice(0, 180),
      sourceTag: sourceButton.tagName?.toLowerCase?.() || "",
      sourceRole: sourceButton.getAttribute("role") || "",
      sourceUrlKind: getUrlKind(href),
      sourceHost: getUrlHost(href),
      canUpload: "true",
      canRetry: "false",
      decisionHint: archiveMode ? "ready_to_archive_attachment" : "ready_to_capture_attachment",
      recommendedAgentAction: archiveMode ? "trigger_archive_or_query_compact_summary" : "trigger_upload_or_collect_patch",
      targetSummary: buildTargetSummary(sanitizeRouteContext(routeContext)),
      bridgeStatusHint: "unknown",
      queueStatusHint: "not_enqueued",
      routeConflictHint: "unknown",
      routeVisualHint: "available_via_bridge",
      compactStatus: "ready",
      uiBadge: archiveMode ? "ARCHIVE" : "PATCH",
      stalenessStatus: "fresh",
      routeContext: sanitizeRouteContext(routeContext),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function buildTargetSummary(context) {
    const value = context || {};
    const project = value.project || "default";
    const repoAlias = value.repoAlias || value.repo_alias || "unresolved-repo";
    const keyAlias = value.keyAlias || value.key_alias || "unresolved-key";
    const mode = value.mode || "auto";
    return `${project} / ${repoAlias} / ${keyAlias} / ${mode}`.slice(0, 240);
  }

  function deriveRecommendedAgentAction(marker) {
    const status = marker?.status || "unknown";
    const stale = marker?.stalenessStatus || "unknown";
    if (status === "uploaded") return "read_receipt_latest_then_continue";
    if (status === "failed") return "retry_or_request_human_review";
    if (stale === "stale") return "refresh_buttons_before_upload";
    if (marker?.mode === "roundpack_archive" && status === "ready") return "trigger_archive_when_roundpack_expected";
    if (status === "uploading" || status === "capturing") return "wait_for_status_event";
    return "inspect_marker_then_decide";
  }

  function sanitizeRouteContext(context) {
    const value = context || {};
    return {
      schemaVersion: "openpatch.route_context.v1",
      project: String(value.project || "").slice(0, 120),
      routeId: String(value.routeId || value.route_id || "").slice(0, 160),
      routeProfile: String(value.routeProfile || value.route_profile || "").slice(0, 160),
      repoAlias: String(value.repoAlias || value.repo_alias || "").slice(0, 120),
      keyAlias: String(value.keyAlias || value.key_alias || "").slice(0, 120),
      browserProfile: String(value.browserProfile || value.browser_profile || "").slice(0, 160),
      actorHint: String(value.actorHint || value.actor_hint || "").slice(0, 120),
      mode: String(value.mode || "auto").slice(0, 80),
      roundId: String(value.roundId || value.round_id || "").slice(0, 160),
      updatedAt: value.updatedAt || value.updated_at || new Date().toISOString()
    };
  }

  function getStalenessStatus(marker) {
    const createdAt = Date.parse(marker?.createdAt || "");
    if (!createdAt) return "unknown";
    return Date.now() - createdAt > BUTTON_STALE_AFTER_MS ? "stale" : "fresh";
  }

  function refreshMarkerForAgent(button) {
    const previous = button.__openpatchAgentMarker || parseMarkerDataset(button);
    const stalenessStatus = getStalenessStatus(previous);
    setButtonMarker(button, {
      stalenessStatus,
      routeContext: sanitizeRouteContext(routeContext)
    }, { quiet: true });
    return button.__openpatchAgentMarker || previous;
  }

  function sanitizeUploadResult(result) {
    if (!result || typeof result !== "object") return null;
    return {
      status: result.status || result.receipt?.status || "",
      mode: result.mode || "",
      owner: result.owner || result.github?.owner || result.receipt?.github?.owner || "",
      repo: result.repo || result.github?.repo || result.receipt?.github?.repo || "",
      branch: result.branch || result.github?.branch || result.receipt?.github?.branch || "",
      path: result.path || result.paths?.archive_path || result.receipt?.github?.archive_path || "",
      manifestPath: result.manifestPath || result.paths?.manifest_path || result.receipt?.github?.manifest_path || "",
      receiptPath: result.receiptPath || result.paths?.receipt_path || result.receipt?.github?.receipt_path || "",
      latestPath: result.latestPath || result.paths?.latest_path || result.receipt?.github?.latest_path || "",
      project: result.project || result.receipt?.project || "",
      roundId: result.roundId || result.round_id || result.receipt?.round_id || "",
      fileSha256: result.fileSha256 || result.file_sha256 || result.receipt?.file_sha256 || "",
      commitSha: result.commitSha || "",
      repositoryUrl: result.repositoryUrl || "",
      branchUrl: result.branchUrl || ""
    };
  }


  function setButtonText(button, text) {
    const badge = button.__openpatchStatusBadge || null;
    button.textContent = text;
    if (badge) button.appendChild(badge);
  }

  function buildUiBadge(marker) {
    const status = String(marker?.status || "unknown");
    const stale = String(marker?.stalenessStatus || "unknown");
    const mode = String(marker?.mode || "");
    if (stale === "stale") return "STALE";
    if (status === "uploaded") return "DONE";
    if (status === "failed") return "FAIL";
    if (status === "uploading" || status === "capturing") return "BUSY";
    if (mode === "roundpack_archive") return "ARCHIVE";
    return "PATCH";
  }

  function createStatusBadge(marker) {
    const badge = document.createElement("span");
    badge.className = "openpatch-status-badge";
    badge.setAttribute("aria-hidden", "true");
    updateBadgeElement(badge, marker);
    return badge;
  }

  function updateBadgeElement(badge, marker) {
    const text = buildUiBadge(marker);
    badge.textContent = text;
    badge.dataset.openpatchBadge = text;
    badge.dataset.openpatchStatus = String(marker?.status || "unknown");
    badge.dataset.openpatchMode = String(marker?.mode || "unknown");
    badge.dataset.openpatchRouteProfile = String(marker?.routeContext?.routeProfile || "");
    badge.title = String(marker?.targetSummary || marker?.decisionHint || text).slice(0, 240);
  }

  function updateStatusBadge(button, marker) {
    let badge = button.__openpatchStatusBadge || button.querySelector?.(".openpatch-status-badge");
    if (!badge) {
      badge = createStatusBadge(marker);
      button.__openpatchStatusBadge = badge;
      button.appendChild(badge);
      return;
    }
    button.__openpatchStatusBadge = badge;
    updateBadgeElement(badge, marker);
  }

  function setButtonMarker(button, patch, options = {}) {
    const previous = button.__openpatchAgentMarker || {};
    const next = {
      ...previous,
      ...patch,
      updatedAt: new Date().toISOString()
    };
    button.__openpatchAgentMarker = next;

    button.dataset.openpatchMarker = next.schemaVersion || "openpatch.agent_button.v16";
    button.dataset.openpatchStatus = String(next.status || "unknown");
    button.dataset.openpatchMode = String(next.mode || "patch_upload");
    button.dataset.openpatchAction = String(next.action || "upload_openpatch_content");
    button.dataset.openpatchFileName = String(next.fileName || "");
    button.dataset.openpatchButtonId = String(next.buttonId || "");
    button.dataset.openpatchPageSessionId = String(next.pageSessionId || PAGE_SESSION_ID);
    button.dataset.openpatchRouteId = String(next.routeContext?.routeId || "");
    button.dataset.openpatchRouteProfile = String(next.routeContext?.routeProfile || "");
    button.dataset.openpatchRepoAlias = String(next.routeContext?.repoAlias || "");
    button.dataset.openpatchKeyAlias = String(next.routeContext?.keyAlias || "");
    button.dataset.openpatchProject = String(next.routeContext?.project || "");
    button.dataset.openpatchStalenessStatus = String(next.stalenessStatus || "unknown");
    button.dataset.openpatchRecommendedAgentAction = String(next.recommendedAgentAction || deriveRecommendedAgentAction(next));
    button.dataset.openpatchTargetSummary = String(next.targetSummary || buildTargetSummary(next.routeContext || routeContext));
    button.dataset.openpatchBridgeStatusHint = String(next.bridgeStatusHint || "unknown");
    button.dataset.openpatchQueueStatusHint = String(next.queueStatusHint || "unknown");
    button.dataset.openpatchRouteConflictHint = String(next.routeConflictHint || "unknown");
    button.dataset.openpatchRouteVisualHint = String(next.routeVisualHint || "available_via_bridge");
    button.dataset.openpatchCompactStatus = String(next.compactStatus || next.status || "unknown");
    button.dataset.openpatchUiBadge = String(next.uiBadge || buildUiBadge(next));
    button.dataset.openpatchExtension = String(next.extension || "");
    button.dataset.openpatchCanUpload = String(next.canUpload || "false");
    button.dataset.openpatchCanRetry = String(next.canRetry || "false");
    button.dataset.openpatchDecisionHint = String(next.decisionHint || "");
    next.recommendedAgentAction = next.recommendedAgentAction || deriveRecommendedAgentAction(next);
    next.targetSummary = next.targetSummary || buildTargetSummary(next.routeContext || routeContext);
    button.dataset.openpatchContext = JSON.stringify(next);
    updateStatusBadge(button, next);

    if (button.__openpatchMarkerNode) {
      button.__openpatchMarkerNode.textContent = JSON.stringify(next, null, 2);
    }

    if (!options.quiet) {
      window.dispatchEvent(new CustomEvent(AGENT_STATUS_EVENT, {
        detail: next
      }));
    }
  }

  function createAgentMarkerNode(button) {
    const marker = document.createElement("script");
    marker.type = "application/json";
    marker.className = AGENT_MARKER_CLASS;
    marker.dataset.openpatchFor = button.dataset.openpatchFileName || "";
    marker.textContent = JSON.stringify(button.__openpatchAgentMarker || {}, null, 2);
    button.__openpatchMarkerNode = marker;
    return marker;
  }

  function getCurrentAgentMarkers() {
    return Array.from(document.querySelectorAll(`.${BUTTON_CLASS}`))
      .map((button, index) => ({
        index,
        ...refreshMarkerForAgent(button)
      }));
  }

  function parseMarkerDataset(button) {
    try {
      return JSON.parse(button.dataset.openpatchContext || "{}");
    } catch {
      return {
        schemaVersion: button.dataset.openpatchMarker || "openpatch.agent_button.v16",
        status: button.dataset.openpatchStatus || "unknown",
        fileName: button.dataset.openpatchFileName || ""
      };
    }
  }

  window.addEventListener(AGENT_BUTTONS_REQUEST_EVENT, (event) => {
    window.dispatchEvent(new CustomEvent(AGENT_BUTTONS_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.agent_buttons_response.v1",
        requestId: event?.detail?.requestId || event?.detail?.request_id || "",
        count: document.querySelectorAll(`.${BUTTON_CLASS}`).length,
        buttons: getCurrentAgentMarkers(),
        createdAt: new Date().toISOString()
      }
    }));
  });

  window.addEventListener(AGENT_ROUTE_CONTEXT_EVENT, (event) => {
    routeContext = {
      ...routeContext,
      ...sanitizeRouteContext(event?.detail || {}),
      updatedAt: new Date().toISOString()
    };
    for (const button of document.querySelectorAll(`.${BUTTON_CLASS}`)) {
      setButtonMarker(button, {
        routeContext: sanitizeRouteContext(routeContext),
        decisionHint: "route_context_updated"
      }, { quiet: true });
    }
    window.dispatchEvent(new CustomEvent(AGENT_STATUS_EVENT, {
      detail: {
        schemaVersion: "openpatch.route_context_ack.v1",
        status: "route_context_updated",
        routeContext: sanitizeRouteContext(routeContext),
        pageSessionId: PAGE_SESSION_ID,
        updatedAt: new Date().toISOString()
      }
    }));
  });

  window.addEventListener(AGENT_STATUS_REQUEST_EVENT, async (event) => {
    let configStatus = { available: false };
    let bridgeStatus = { available: false };
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_OPENPATCH_CONFIG_STATUS" });
      configStatus = response?.result || { available: false };
    } catch (error) {
      configStatus = { available: false, error: error?.message || "runtime_status_unavailable" };
    }
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_OPENPATCH_BRIDGE_STATUS" });
      bridgeStatus = response?.result || { available: false };
    } catch (error) {
      bridgeStatus = { available: false, error: error?.message || "bridge_status_unavailable" };
    }
    window.dispatchEvent(new CustomEvent(AGENT_STATUS_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.runtime_status.v6",
        requestId: event?.detail?.requestId || event?.detail?.request_id || "",
        pageSessionId: PAGE_SESSION_ID,
        routeContext: sanitizeRouteContext(routeContext),
        buttons: getCurrentAgentMarkers(),
        configStatus,
        bridgeStatus,
        createdAt: new Date().toISOString()
      }
    }));
  });

  window.addEventListener(AGENT_BRIDGE_STATUS_EVENT, async (event) => {
    let bridgeStatus = { available: false };
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_OPENPATCH_BRIDGE_STATUS" });
      bridgeStatus = response?.result || { available: false };
    } catch (error) {
      bridgeStatus = { available: false, error: error?.message || "bridge_status_unavailable" };
    }
    window.dispatchEvent(new CustomEvent(AGENT_BRIDGE_STATUS_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.bridge_status_response.v1",
        requestId: event?.detail?.requestId || event?.detail?.request_id || "",
        bridgeStatus,
        createdAt: new Date().toISOString()
      }
    }));
  });

  window.addEventListener(AGENT_ROUNDPACK_PROMPT_EVENT, (event) => {
    const detail = event?.detail || {};
    const project = detail.project || routeContext.project || "default";
    window.dispatchEvent(new CustomEvent(AGENT_ROUNDPACK_PROMPT_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.roundpack_prompt_response.v1",
        requestId: detail.requestId || detail.request_id || "",
        project,
        routeContext: sanitizeRouteContext(routeContext),
        prompt: ROUNDPACK_PROMPT.replace(/<project>/g, project),
        recommendedAgentAction: "send_prompt_then_wait_for_round_pack_ready_marker",
        createdAt: new Date().toISOString()
      }
    }));
  });

  window.addEventListener(AGENT_AGENT_SUMMARY_EVENT, async (event) => {
    const detail = event?.detail || {};
    let bridgeSummary = { available: false };
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_OPENPATCH_AGENT_SUMMARY",
        project: detail.project || routeContext.project || "default"
      });
      bridgeSummary = response?.result || { available: false };
    } catch (error) {
      bridgeSummary = { available: false, error: error?.message || "agent_summary_unavailable" };
    }
    window.dispatchEvent(new CustomEvent(AGENT_AGENT_SUMMARY_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.agent_summary_response.v1",
        requestId: detail.requestId || detail.request_id || "",
        pageSessionId: PAGE_SESSION_ID,
        routeContext: sanitizeRouteContext(routeContext),
        buttons: getCurrentAgentMarkers(),
        bridgeSummary,
        createdAt: new Date().toISOString()
      }
    }));
  });


  window.addEventListener(AGENT_COMPACT_SUMMARY_EVENT, async (event) => {
    const detail = event?.detail || {};
    let compactSummary = { available: false };
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_OPENPATCH_COMPACT_SUMMARY",
        project: detail.project || routeContext.project || "default"
      });
      compactSummary = response?.result || { available: false };
    } catch (error) {
      compactSummary = { available: false, error: error?.message || "compact_summary_unavailable" };
    }
    window.dispatchEvent(new CustomEvent(AGENT_COMPACT_SUMMARY_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.compact_summary_response.v1",
        requestId: detail.requestId || detail.request_id || "",
        pageSessionId: PAGE_SESSION_ID,
        routeContext: sanitizeRouteContext(routeContext),
        buttonCount: document.querySelectorAll(`.${BUTTON_CLASS}`).length,
        buttons: getCurrentAgentMarkers().slice(0, 20).map((marker) => ({
          buttonId: marker.buttonId,
          fileName: marker.fileName,
          status: marker.status,
          mode: marker.mode,
          stalenessStatus: marker.stalenessStatus,
          recommendedAgentAction: marker.recommendedAgentAction,
          targetSummary: marker.targetSummary,
          routeConflictHint: marker.routeConflictHint || "unknown"
        })),
        compactSummary,
        createdAt: new Date().toISOString()
      }
    }));
  });

  window.addEventListener(AGENT_RESOLVE_ROUTE_EVENT, async (event) => {
    const detail = event?.detail || {};
    let result;
    try {
      const response = await chrome.runtime.sendMessage({
        type: "RESOLVE_OPENPATCH_ROUTE",
        pageUrl: detail.pageUrl || detail.page_url || window.location.href,
        title: detail.title || document.title || "",
        projectHint: detail.project || detail.project_hint || routeContext.project || "",
        routeProfile: detail.routeProfile || detail.route_profile || routeContext.routeProfile || ""
      });
      result = response?.result || { ok: false, error: "route_resolution_unavailable" };
      if (result.ok && result.route_context) {
        const resolved = result.route_context;
        routeContext = sanitizeRouteContext({
          ...routeContext,
          project: resolved.project || routeContext.project,
          routeProfile: resolved.route_profile || resolved.routeProfile || routeContext.routeProfile,
          repoAlias: resolved.repo_alias || resolved.repoAlias || routeContext.repoAlias,
          keyAlias: resolved.key_alias || resolved.keyAlias || routeContext.keyAlias,
          mode: resolved.mode || routeContext.mode,
          updatedAt: new Date().toISOString()
        });
        for (const button of document.querySelectorAll(`.${BUTTON_CLASS}`)) {
          const ambiguityStatus = resolved.ambiguity?.status || result.route_context?.ambiguity?.status || result.ambiguity?.status || "clear";
          setButtonMarker(button, {
            routeContext: sanitizeRouteContext(routeContext),
            routeConflictHint: ambiguityStatus,
            decisionHint: ambiguityStatus === "ambiguous" ? "route_resolution_ambiguous_confirm_before_upload" : "route_resolved_by_bridge",
            recommendedAgentAction: ambiguityStatus === "ambiguous" ? "confirm_route_context_before_upload" : "continue_with_resolved_route"
          }, { quiet: true });
        }
      }
    } catch (error) {
      result = { ok: false, error: error?.message || "route_resolution_failed" };
    }
    window.dispatchEvent(new CustomEvent(AGENT_RESOLVE_ROUTE_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.resolve_route_response.v1",
        requestId: detail.requestId || detail.request_id || "",
        result,
        routeContext: sanitizeRouteContext(routeContext),
        createdAt: new Date().toISOString()
      }
    }));
  });


  window.addEventListener(AGENT_ROUTE_CONFLICTS_EVENT, async (event) => {
    const detail = event?.detail || {};
    let result;
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_OPENPATCH_ROUTE_CONFLICTS",
        pageUrl: detail.pageUrl || detail.page_url || window.location.href,
        title: detail.title || document.title || "",
        projectHint: detail.project || detail.project_hint || routeContext.project || ""
      });
      result = response?.result || { ok: false, error: "route_conflicts_unavailable" };
      const hint = result.has_blocking_conflict ? "blocking_conflict" : (result.dynamic?.ambiguous ? "ambiguous" : (result.issue_count ? "warnings" : "clear"));
      for (const button of document.querySelectorAll(`.${BUTTON_CLASS}`)) {
        setButtonMarker(button, { routeConflictHint: hint, decisionHint: hint === "clear" ? "route_conflicts_clear" : "route_conflict_or_warning_detected" }, { quiet: true });
      }
    } catch (error) {
      result = { ok: false, error: error?.message || "route_conflicts_failed" };
    }
    window.dispatchEvent(new CustomEvent(AGENT_ROUTE_CONFLICTS_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.route_conflicts_response.v1",
        requestId: detail.requestId || detail.request_id || "",
        result,
        routeContext: sanitizeRouteContext(routeContext),
        createdAt: new Date().toISOString()
      }
    }));
  });



  window.addEventListener(AGENT_ROUTE_VISUAL_EVENT, async (event) => {
    const detail = event?.detail || {};
    let result;
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_OPENPATCH_ROUTE_VISUAL",
        pageUrl: detail.pageUrl || detail.page_url || window.location.href,
        title: detail.title || document.title || "",
        projectHint: detail.project || detail.project_hint || routeContext.project || ""
      });
      result = response?.result || { ok: false, error: "route_visual_unavailable" };
      const hint = result.recommended_agent_action || "route_visual_available";
      for (const button of document.querySelectorAll(`.${BUTTON_CLASS}`)) {
        setButtonMarker(button, { routeVisualHint: hint }, { quiet: true });
      }
    } catch (error) {
      result = { ok: false, error: error?.message || "route_visual_failed" };
    }
    window.dispatchEvent(new CustomEvent(AGENT_ROUTE_VISUAL_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.route_visual_response.v12",
        requestId: detail.requestId || detail.request_id || "",
        result,
        routeContext: sanitizeRouteContext(routeContext),
        createdAt: new Date().toISOString()
      }
    }));
  });

  window.addEventListener(AGENT_ARCHIVE_REQUEST_EVENT, (event) => {
    const detail = event?.detail || {};
    const requestedFileName = String(detail.fileName || detail.file_name || "").toLowerCase();
    const markers = getCurrentAgentMarkers();
    const match = markers.find((marker) => {
      if (!requestedFileName) return marker.status === "ready";
      return String(marker.fileName || "").toLowerCase() === requestedFileName;
    });
    window.dispatchEvent(new CustomEvent(AGENT_ARCHIVE_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.archive_request_ack.v1",
        requestId: detail.requestId || detail.request_id || "",
        status: match ? "candidate_found" : "candidate_missing",
        candidate: match || null,
        routeContext: sanitizeRouteContext(routeContext),
        createdAt: new Date().toISOString()
      }
    }));
  });



  window.addEventListener(AGENT_TRIGGER_UPLOAD_EVENT, (event) => {
    const detail = event?.detail || {};
    const buttonId = String(detail.buttonId || detail.button_id || "");
    const fileName = String(detail.fileName || detail.file_name || "").toLowerCase();
    const allowStale = Boolean(detail.allowStale || detail.allow_stale);
    const candidates = Array.from(document.querySelectorAll(`.${BUTTON_CLASS}`));
    const button = candidates.find((candidate) => {
      const marker = refreshMarkerForAgent(candidate);
      if (!allowStale && marker.stalenessStatus === "stale") return false;
      if (buttonId && marker.buttonId === buttonId) return true;
      if (fileName && String(marker.fileName || "").toLowerCase() === fileName) return true;
      return false;
    });

    if (button && !button.disabled) {
      button.click();
    }

    window.dispatchEvent(new CustomEvent(AGENT_TRIGGER_UPLOAD_RESPONSE_EVENT, {
      detail: {
        schemaVersion: "openpatch.trigger_upload_response.v1",
        requestId: detail.requestId || detail.request_id || "",
        status: button ? "triggered" : "candidate_missing",
        buttonId: button?.dataset?.openpatchButtonId || "",
        fileName: button?.dataset?.openpatchFileName || "",
        createdAt: new Date().toISOString()
      }
    }));
  });

  function captureDownloadFromSource({ sourceButton, suggestedName }) {
    return new Promise((resolve, reject) => {
      const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error("没有直接读取到附件内容，请确认这个按钮是 .zip、.diff 或 .patch 下载入口。"));
      }, 10000);

      function cleanup() {
        window.clearTimeout(timer);
        window.removeEventListener("message", onMessage);
      }

      function onMessage(event) {
        if (event.source !== window) return;

        const data = event.data || {};
        if (data.source !== CAPTURE_RESPONSE_SOURCE || data.id !== id) return;

        cleanup();
        if (!data.ok) {
          reject(new Error(data.error || "读取附件失败。"));
          return;
        }

        resolve({
          fileName: data.fileName,
          content: data.content,
          url: data.url
        });
      }

      window.addEventListener("message", onMessage);
      window.dispatchEvent(new CustomEvent(CAPTURE_EVENT, {
        detail: {
          id,
          suggestedName
        }
      }));

      window.setTimeout(() => {
        sourceButton.click();
      }, 0);
    });
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.documentElement.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  function showToast(message) {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement("div");
      toast.id = TOAST_ID;
      document.documentElement.append(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 1800);
  }

  function isInsideNavigation(candidate) {
    return Boolean(candidate.closest([
      "nav",
      "aside",
      "[role='navigation']",
      "[aria-label*='历史']",
      "[aria-label*='History']",
      "[data-testid*='sidebar']"
    ].join(",")));
  }

  function isInsideAssistantContent(candidate) {
    return Boolean(candidate.closest([
      "[data-message-author-role='assistant']",
      ".markdown-new-styling",
      ".markdown.prose",
      ".markdown",
      ".prose",
      "article"
    ].join(",")));
  }

  function attachButtons() {
    const candidates = document.querySelectorAll("button, a");

    for (const candidate of candidates) {
      if (candidate.classList?.contains(BUTTON_CLASS)) continue;
      if (isInsideNavigation(candidate)) continue;
      if (!isInsideAssistantContent(candidate)) continue;
      if (candidate.nextElementSibling?.classList?.contains(BUTTON_CLASS)) continue;

      const text = candidate.textContent || candidate.getAttribute("aria-label") || "";
      if (!looksLikePatchDownloadText(text)) continue;

      const uploadButton = createInlineButton(candidate);
      candidate.insertAdjacentElement("afterend", uploadButton);
      uploadButton.insertAdjacentElement("afterend", createAgentMarkerNode(uploadButton));
    }
  }

  function installToolbar() {
    if (document.getElementById(TOOLBAR_ID)) return;

    const toolbar = document.createElement("div");
    toolbar.id = TOOLBAR_ID;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "openpatch-toolbar-toggle";
    toggle.textContent = "OpenPatch";
    toggle.title = "展开或收起 OpenPatch 工具";
    toggle.setAttribute("aria-expanded", "false");

    const actions = document.createElement("div");
    actions.className = "openpatch-toolbar-actions";

    const openSubmit = document.createElement("button");
    openSubmit.type = "button";
    openSubmit.textContent = "Upload";
    openSubmit.title = "Open the manual upload page";
    openSubmit.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_SUBMIT_PAGE" });
    });

    const settings = document.createElement("button");
    settings.type = "button";
    settings.textContent = "设置";
    settings.title = "配置 GitHub Token 和仓库";
    settings.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" });
    });

    const copyZipPrompt = document.createElement("button");
    copyZipPrompt.type = "button";
    copyZipPrompt.textContent = "复制 ZIP 提示词";
    copyZipPrompt.title = "复制 changed-files.zip 生成提示词";
    copyZipPrompt.addEventListener("click", async () => {
      try {
        await copyText(ZIP_PACKAGE_PROMPT);
        showToast("ZIP 提示词已复制");
      } catch (error) {
        showToast("复制失败，请手动重试");
      }
    });

    const copyRoundPackPrompt = document.createElement("button");
    copyRoundPackPrompt.type = "button";
    copyRoundPackPrompt.textContent = "复制 RoundPack 提示词";
    copyRoundPackPrompt.title = "复制 webai-roundpack.zip 归档提示词";
    copyRoundPackPrompt.addEventListener("click", async () => {
      try {
        await copyText(ROUNDPACK_PROMPT);
        showToast("RoundPack 提示词已复制");
      } catch (error) {
        showToast("复制失败，请手动重试");
      }
    });

    const copyDiffPrompt = document.createElement("button");
    copyDiffPrompt.type = "button";
    copyDiffPrompt.textContent = "复制 Diff 提示词";
    copyDiffPrompt.title = "复制 Git 生成 diff 的提示词";
    copyDiffPrompt.addEventListener("click", async () => {
      try {
        await copyText(GIT_DIFF_PROMPT);
        showToast("Diff 提示词已复制");
      } catch (error) {
        showToast("复制失败，请手动重试");
      }
    });

    toggle.addEventListener("click", () => {
      const isOpen = toolbar.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    actions.append(openSubmit, copyRoundPackPrompt, copyZipPrompt, copyDiffPrompt, settings);
    toolbar.append(toggle, actions);
    document.documentElement.append(toolbar);
  }

  function scheduleAttachButtons() {
    if (attachScheduled) return;
    attachScheduled = true;
    window.requestAnimationFrame(() => {
      attachScheduled = false;
      attachButtons();
      installToolbar();
    });
  }

  scheduleAttachButtons();
  const retryTimer = window.setInterval(scheduleAttachButtons, 1000);
  window.setTimeout(() => window.clearInterval(retryTimer), 15000);

  const observer = new MutationObserver(() => {
    scheduleAttachButtons();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
