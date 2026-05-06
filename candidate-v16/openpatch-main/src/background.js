import { getConfig, savePatchDownload } from "./storage.js";
import { uploadOpenPatchFile, uploadRoundArchiveContent } from "./uploader.js";
import { buildDefaultCommitTitle, encodeBase64Bytes, isArchiveFileName, isPatchFileName } from "./utils.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus?.removeAll?.();
});

chrome.downloads.onChanged.addListener(async (delta) => {
  if (!delta.state || delta.state.current !== "complete") {
    return;
  }

  const items = await chrome.downloads.search({ id: delta.id });
  const item = items[0];
  if (!item?.filename || !isPatchFileName(item.filename)) {
    return;
  }

  await savePatchDownload(item);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

async function handleMessage(message) {
  if (message?.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage();
    return null;
  }

  if (message?.type === "OPEN_SUBMIT_PAGE") {
    const url = new URL(chrome.runtime.getURL("pages/submit.html"));
    if (message.suggestedName) {
      url.searchParams.set("name", message.suggestedName);
    }
    if (message.title) {
      url.searchParams.set("title", message.title);
    }
    await chrome.tabs.create({ url: url.toString() });
    return null;
  }

  if (message?.type === "GET_OPENPATCH_CONFIG_STATUS") {
    const config = await getConfig();
    return {
      schemaVersion: "openpatch.config_status.v1",
      configured: Boolean(config.githubToken && config.repo && config.baseBranch && config.patchDir),
      hasToken: Boolean(config.githubToken),
      owner: config.owner || "",
      repo: config.repo || "",
      baseBranch: config.baseBranch || "",
      patchDir: config.patchDir || "",
      mode: config.mode || "patch_upload",
      projectId: config.projectId || "",
      routeProfileId: config.routeProfileId || "",
      repoAlias: config.repoAlias || "",
      keyAlias: config.keyAlias || "",
      bridgeEnabled: Boolean(config.bridgeEnabled),
      bridgeUrl: config.bridgeUrl ? "configured" : "",
      bridgeHandlesUpload: Boolean(config.bridgeHandlesUpload),
      archiveRoot: config.archiveRoot || "rounds",
      indexRoot: config.indexRoot || "index",
      archiveModeDefault: config.archiveModeDefault || "auto",
      maxArchiveSizeMb: Number(config.maxArchiveSizeMb || 50),
      autoOpenBranch: Boolean(config.autoOpenBranch)
    };
  }



  if (message?.type === "GET_OPENPATCH_AGENT_SUMMARY") {
    const config = await getConfig();
    const project = message.project || message.projectId || config.projectId || "default";
    return getBridgeJson(config, `/agent/summary?project=${encodeURIComponent(project)}`);
  }

  if (message?.type === "GET_OPENPATCH_COMPACT_SUMMARY") {
    const config = await getConfig();
    const project = message.project || message.projectId || config.projectId || "default";
    return getBridgeJson(config, `/agent/compact-summary?project=${encodeURIComponent(project)}`);
  }

  if (message?.type === "GET_OPENPATCH_BRIDGE_LATEST") {
    const config = await getConfig();
    const project = message.project || message.projectId || config.projectId || "default";
    return getBridgeJson(config, `/latest?project=${encodeURIComponent(project)}`);
  }

  if (message?.type === "GET_OPENPATCH_BRIDGE_QUEUE") {
    const config = await getConfig();
    return getBridgeJson(config, "/queue/status");
  }

  if (message?.type === "ARCHIVE_ROUNDPACK_CONTENT") {
    const fileName = message.fileName || "";
    if (!isArchiveFileName(fileName)) {
      throw new Error("没有读取到可归档的 .zip、.json、.md 或 .txt 文件。");
    }
    const content = message.content || await fetchUploadContent(message.url);

    const config = await getConfig();
    let result;
    if (config.bridgeEnabled && config.bridgeHandlesUpload) {
      result = await postBridge(config, "/archive/base64", {
        source: "openpatch-extension",
        file_name: fileName,
        content_base64: content,
        title: message.title || `archive: ${fileName}`,
        route_context: message.routeContext || {},
        project: message.routeContext?.project || config.projectId || "default",
        repo_alias: message.routeContext?.repoAlias || message.routeContext?.repo_alias || config.repoAlias || "",
        key_alias: message.routeContext?.keyAlias || message.routeContext?.key_alias || config.keyAlias || "",
        archive_root: config.archiveRoot || "rounds",
        index_root: config.indexRoot || "index",
        page_url: message.routeContext?.pageUrl || message.routeContext?.page_url || "",
        page_title: message.routeContext?.pageTitle || message.routeContext?.page_title || ""
      });
    } else {
      result = await uploadRoundArchiveContent({
        config,
        fileName,
        content,
        routeContext: message.routeContext || {},
        title: message.title || `archive: ${fileName}`
      });

      const bridgeReceipt = await postBridgeReceipt(config, {
        source: "openpatch-extension",
        result,
        receipt: result.receipt,
        route_context: message.routeContext || {}
      });
      result.bridgeReceipt = bridgeReceipt;
    }

    if (config.autoOpenBranch) {
      await chrome.tabs.create({ url: result.branchUrl });
    }

    return result;
  }

  if (message?.type === "GET_OPENPATCH_ROUTE_CONFLICTS") {
    const config = await getConfig();
    return postBridge(config, "/routes/conflicts", {
      page_url: message.pageUrl || message.page_url || "",
      title: message.title || "",
      project_hint: message.project || message.projectHint || ""
    });
  }

  if (message?.type === "RESOLVE_OPENPATCH_ROUTE") {
    const config = await getConfig();
    return postBridge(config, "/resolve-route", {
      page_url: message.pageUrl || message.page_url || "",
      title: message.title || "",
      project_hint: message.project || message.projectHint || "",
      route_profile: message.routeProfile || message.route_profile || ""
    });
  }


  if (message?.type === "GET_OPENPATCH_ROUTE_VISUAL") {
    const config = await getConfig();
    return postBridge(config, "/routes/visual-map", {
      page_url: message.pageUrl || message.page_url || "",
      title: message.title || "",
      project_hint: message.project || message.projectHint || ""
    });
  }

  if (message?.type === "GET_OPENPATCH_BRIDGE_STATUS") {
    const config = await getConfig();
    return getBridgeJson(config, "/health");
  }

  if (message?.type === "UPLOAD_OPENPATCH_CONTENT") {
    let fileName = message.fileName || "";
    if (!isPatchFileName(fileName)) {
      throw new Error("没有读取到可上传的 .zip、.diff 或 .patch 文件。");
    }
    const content = message.content || await fetchUploadContent(message.url);

    const config = await getConfig();
    const result = await uploadOpenPatchFile({
      config,
      fileName,
      content,
      title: message.title || buildDefaultCommitTitle(fileName)
    });

    if (config.autoOpenBranch) {
      await chrome.tabs.create({ url: result.branchUrl });
    }

    return result;
  }

  throw new Error("未知操作。");
}

async function postBridgeReceipt(config, payload) {
  if (!config?.bridgeEnabled || !config?.bridgeUrl) {
    return { ok: false, status: "bridge_disabled" };
  }
  try {
    return await postBridge(config, "/receipts", payload);
  } catch (error) {
    return { ok: false, status: "bridge_error", error: error.message };
  }
}

async function postBridge(config, endpoint, payload) {
  const base = normalizeBridgeUrl(config.bridgeUrl);
  if (!base) throw new Error("Bridge URL 未配置。");
  const response = await fetch(`${base}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || `Bridge HTTP ${response.status}`);
  }
  return json;
}

async function getBridgeJson(config, endpoint) {
  const base = normalizeBridgeUrl(config.bridgeUrl);
  if (!base) return { ok: false, status: "bridge_url_missing" };
  const response = await fetch(`${base}${endpoint}`, { method: "GET" });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.error || `Bridge HTTP ${response.status}`);
  }
  return json;
}

function normalizeBridgeUrl(url) {
  const value = String(url || "").trim().replace(/\/+$/, "");
  if (!value) return "";
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

async function fetchUploadContent(url) {
  if (!url) {
    throw new Error("没有读取到附件内容。");
  }

  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`读取附件失败：HTTP ${response.status}`);
  }

  return encodeBase64Bytes(await response.arrayBuffer());
}
