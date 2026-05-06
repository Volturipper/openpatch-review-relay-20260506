export const DEFAULT_CONFIG = {
  githubToken: "",
  owner: "",
  repo: "",
  baseBranch: "main",
  patchDir: ".ai-patches",
  autoOpenBranch: true,
  mode: "patch_upload",
  projectId: "",
  routeProfileId: "",
  repoAlias: "",
  keyAlias: "",
  bridgeEnabled: false,
  bridgeUrl: "",
  bridgeHandlesUpload: true,
  archiveRoot: "rounds",
  indexRoot: "index",
  archiveModeDefault: "auto",
  maxArchiveSizeMb: 50
};

export function parseRepositoryInput(input) {
  const value = String(input || "").trim();
  if (!value) {
    return { owner: "", repo: "" };
  }

  let path = value
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^git@github\.com:/i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");

  const parts = path.split("/").filter(Boolean);
  if (parts.length === 1) {
    return { owner: "", repo: parts[0] };
  }

  if (parts.length < 2) {
    return { owner: "", repo: "" };
  }

  return {
    owner: parts[0],
    repo: parts[1]
  };
}

export function formatRepositoryInput(config) {
  if (config?.owner && config?.repo) {
    return `${config.owner}/${config.repo}`;
  }

  if (config?.repo) {
    return config.repo;
  }

  if (!config?.owner) {
    return "";
  }

  return config.owner;
}

export function validateConfig(config) {
  const missing = [];
  if (!config?.githubToken) missing.push("GitHub Token");
  if (!config?.repo) missing.push("仓库地址");
  if (!config?.baseBranch) missing.push("目标分支");
  if (!config?.patchDir) missing.push("Patch 目录");

  return {
    ok: missing.length === 0,
    missing
  };
}

export function isPatchFileName(name) {
  return /\.(diff|patch|zip)$/i.test(String(name || ""));
}

export function getUploadFileExtension(name) {
  const match = String(name || "").match(/\.([a-z0-9]+)$/i);
  const extension = match?.[1]?.toLowerCase() || "";
  if (["diff", "patch", "zip"].includes(extension)) {
    return extension;
  }
  return "";
}

export function buildDefaultCommitTitle(fileName) {
  const name = String(fileName || "upload").trim() || "upload";
  if (name.toLowerCase().endsWith(".zip")) {
    return `ai: apply changed files package ${name}`;
  }
  return `ai: apply ${name}`;
}

export function looksLikePatchDownloadText(text) {
  const value = String(text || "").trim().toLowerCase();
  if (!value) return false;
  if (/\.(tar|gz|rar|7z)\b/i.test(value)) return false;

  return /\.(diff|patch|zip)\b/i.test(value)
    || /\b(diff|patch)\s*(文件|file)?\b/i.test(value)
    || /changed-files\.zip|代码包|文件包|压缩包/i.test(value);
}

export function sanitizePatchName(name) {
  const base = String(name || "ai-patch")
    .replace(/\.(diff|patch|zip)$/i, "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .toLowerCase();

  return base || "ai-patch";
}

export function formatTimestamp(date = new Date()) {
  const pad = (number) => String(number).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("") + "-" + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join("");
}

export function randomShortId(length = 4) {
  const bytes = new Uint8Array(Math.max(2, Math.ceil(length / 2)));
  globalThis.crypto?.getRandomValues?.(bytes);

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (hex.replace(/0/g, "").length > 0) {
    return hex.slice(0, length);
  }

  return Math.random().toString(16).slice(2, 2 + length).padEnd(length, "0");
}

export function normalizePatchDirectory(dir) {
  const value = String(dir || ".ai-patches").trim().replace(/^\/+|\/+$/g, "");
  return value || ".ai-patches";
}

export function normalizeAgentAlias(value, fallback = "default") {
  const alias = String(value || fallback)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .toLowerCase();
  return alias || fallback;
}

export function buildRoundArchivePath({ root = "rounds", project = "default", roundId, fileName = "webai-roundpack.zip", now = new Date() }) {
  const safeRoot = normalizePatchDirectory(root || "rounds");
  const safeProject = normalizeAgentAlias(project || "default", "default");
  const safeRound = normalizeAgentAlias(roundId || `${formatTimestamp(now)}-${randomShortId(4)}`, "round");
  const safeFile = String(fileName || "webai-roundpack.zip")
    .replace(/[\/]+/g, "-")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "") || "webai-roundpack.zip";
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${safeRoot}/${safeProject}/${year}/${month}/${day}/${safeRound}/${safeFile}`;
}

export function buildPatchUploadPath({ patchDir, originalName, extension = "diff", now = new Date(), randomId }) {
  const safeName = sanitizePatchName(originalName);
  const safeExt = String(extension || "diff").replace(/^\./, "").toLowerCase();
  const id = randomId || randomShortId(4);
  return `${normalizePatchDirectory(patchDir)}/${safeName}-${formatTimestamp(now)}-${id}.${safeExt}`;
}

export function buildPatchMetadataPath(patchPath) {
  return String(patchPath).replace(/\.(diff|patch|zip)$/i, ".json");
}

export function buildPatchMetadata({ title, originalName, patchPath, createdAt = new Date() }) {
  return {
    title: String(title || "").trim(),
    originalName: String(originalName || ""),
    patchPath,
    createdAt: createdAt.toISOString(),
    tool: "openpatch"
  };
}

export function encodeBase64Utf8(text) {
  const value = String(text ?? "");
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function encodeBase64Bytes(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function buildRepositoryUrl({ owner, repo }) {
  return `https://github.com/${owner}/${repo}`;
}

export function buildBranchUrl({ owner, repo, branch }) {
  return `${buildRepositoryUrl({ owner, repo })}/tree/${encodeURIComponent(branch)}`;
}

export function classifyOpenPatchAsset({ fileName = "", label = "", configuredMode = "auto" } = {}) {
  const name = String(fileName || "").trim();
  const lower = name.toLowerCase();
  const text = `${name} ${label || ""}`.toLowerCase();
  const mode = String(configuredMode || "auto").toLowerCase();
  const ext = getUploadFileExtension(name) || (lower.match(/\.([a-z0-9]+)$/)?.[1] || "");

  const base = {
    schema_version: "openpatch.asset_classifier.v17",
    file_name: name,
    extension: ext,
    asset_kind: "unknown",
    route_decision: "unknown_blocked",
    route_decision_reason: "unknown_asset_kind_requires_explicit_route",
    allowed_action: "none",
    mode: "blocked",
    can_upload: false,
    not_approval: true
  };

  if (mode === "archive_only" || mode === "roundpack_archive") {
    return { ...base, asset_kind: "forced_archive", route_decision: "archive_allowed", route_decision_reason: "configured_archive_mode", allowed_action: "archive_roundpack_content", mode: "roundpack_archive", can_upload: true, not_approval: true };
  }
  if (mode === "patch_upload" && /\.(diff|patch)$/i.test(lower)) {
    return { ...base, asset_kind: "patch_diff", route_decision: "patch_upload_allowed", route_decision_reason: "configured_patch_upload_diff_or_patch", allowed_action: "upload_openpatch_content", mode: "patch_upload", can_upload: true, not_approval: false };
  }

  if (lower === "changed-files.zip") {
    return { ...base, asset_kind: "changed_files_zip", route_decision: "patch_upload_allowed", route_decision_reason: "exact_changed_files_zip", allowed_action: "upload_openpatch_content", mode: "patch_upload", can_upload: true, not_approval: false };
  }
  if (lower === "openpatch.diff" || lower === "openpatch.patch" || /\.(diff|patch)$/i.test(lower)) {
    return { ...base, asset_kind: "patch_diff", route_decision: "patch_upload_allowed", route_decision_reason: "diff_or_patch_extension", allowed_action: "upload_openpatch_content", mode: "patch_upload", can_upload: true, not_approval: false };
  }
  if (/webai[-_]?roundpack|round[-_ ]?pack|roundpack/.test(text)) {
    return { ...base, asset_kind: "roundpack_archive", route_decision: "archive_allowed", route_decision_reason: "roundpack_name_or_label", allowed_action: "archive_roundpack_content", mode: "roundpack_archive", can_upload: true, not_approval: true };
  }
  if (/review.*result|review[-_ ]?pack|audit[-_ ]?pack|external[-_ ]?audit|审核包|审查包/.test(text)) {
    return { ...base, asset_kind: "review_evidence", route_decision: "archive_allowed", route_decision_reason: "review_or_audit_evidence_name", allowed_action: "archive_roundpack_content", mode: "roundpack_archive", can_upload: true, not_approval: true };
  }
  if (/candidate|handoff|evidence|receipt|deliverable|候选|交接|证据/.test(text)) {
    return { ...base, asset_kind: "candidate_or_evidence_archive", route_decision: "archive_allowed", route_decision_reason: "candidate_handoff_evidence_name", allowed_action: "archive_roundpack_content", mode: "roundpack_archive", can_upload: true, not_approval: true };
  }
  if (ext === "zip") {
    return { ...base, asset_kind: "unknown_zip", route_decision: "unknown_blocked", route_decision_reason: "unknown_zip_requires_explicit_changed_files_or_roundpack_or_review_name", allowed_action: "none", mode: "blocked", can_upload: false, not_approval: true };
  }
  return base;
}


export function looksLikeRoundPackDownloadText(text) {
  const value = String(text || "").trim().toLowerCase();
  if (!value) return false;
  return /round\s*pack|roundpack|webai-roundpack|review-pack|audit-pack|handoff|evidence|receipt|归档|回合包|交接包|审核包|证据包/i.test(value);
}

export function isArchiveFileName(name) {
  return /\.(zip|json|md|txt)$/i.test(String(name || ""));
}

export function shouldUseArchiveMode({ fileName = "", label = "", configuredMode = "auto" } = {}) {
  return classifyOpenPatchAsset({ fileName, label, configuredMode }).mode === "roundpack_archive";
}

export function sanitizeArchiveFileName(name, fallback = "webai-roundpack.zip") {
  const value = String(name || fallback)
    .replace(/[\\/]+/g, "-")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");
  return value || fallback;
}

export function buildRoundId({ project = "default", now = new Date(), randomId } = {}) {
  return `${normalizeAgentAlias(project, "default")}-${formatTimestamp(now)}-${randomId || randomShortId(6)}`;
}

export function buildSiblingArchivePath(path, fileName) {
  const parts = String(path || "").split("/");
  parts[parts.length - 1] = sanitizeArchiveFileName(fileName, fileName);
  return parts.join("/");
}

export function buildRoundReceiptPath(archivePath) {
  return buildSiblingArchivePath(archivePath, "upload_receipt.json");
}

export function buildRoundManifestPath(archivePath) {
  return buildSiblingArchivePath(archivePath, "archive_manifest.json");
}

export function buildLatestIndexPath({ indexRoot = "index", project = "default" } = {}) {
  const root = normalizePatchDirectory(indexRoot || "index");
  return `${root}/latest/${normalizeAgentAlias(project, "default")}.json`;
}

export async function sha256Base64Content(base64Content) {
  const binary = atob(String(base64Content || ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function buildRoundUploadReceipt({
  project,
  roundId,
  fileName,
  fileSha256,
  archivePath,
  receiptPath,
  latestPath,
  owner,
  repo,
  branch,
  routeContext = {},
  createdAt = new Date()
}) {
  return {
    schema_version: "openpatch.upload_receipt.v1",
    status: "uploaded",
    archive_only: true,
    allow_execution: false,
    project: normalizeAgentAlias(project || routeContext.project || "default", "default"),
    round_id: String(roundId || ""),
    file_name: sanitizeArchiveFileName(fileName),
    file_sha256: String(fileSha256 || ""),
    github: {
      owner: String(owner || ""),
      repo: String(repo || ""),
      branch: String(branch || ""),
      archive_path: String(archivePath || ""),
      receipt_path: String(receiptPath || ""),
      latest_path: String(latestPath || "")
    },
    route_context: {
      route_id: String(routeContext.routeId || routeContext.route_id || ""),
      route_profile: String(routeContext.routeProfile || routeContext.route_profile || ""),
      repo_alias: String(routeContext.repoAlias || routeContext.repo_alias || ""),
      key_alias: String(routeContext.keyAlias || routeContext.key_alias || ""),
      page_session_id: String(routeContext.pageSessionId || routeContext.page_session_id || "")
    },
    created_at: createdAt.toISOString(),
    next_actions: ["read_latest", "fetch_roundpack", "read_receipt", "continue_agent_workflow"]
  };
}

export function buildLatestIndex({ receipt, previous = null, createdAt = new Date() }) {
  const history = Array.isArray(previous?.recent_rounds) ? previous.recent_rounds.slice(0, 19) : [];
  const current = {
    round_id: receipt.round_id,
    project: receipt.project,
    status: receipt.status,
    file_name: receipt.file_name,
    file_sha256: receipt.file_sha256,
    archive_path: receipt.github?.archive_path || "",
    receipt_path: receipt.github?.receipt_path || "",
    created_at: receipt.created_at
  };
  return {
    schema_version: "openpatch.latest.v1",
    project: receipt.project,
    latest_round: receipt.round_id,
    status: receipt.status,
    archive_only: true,
    allow_execution: false,
    latest: current,
    recent_rounds: [current, ...history.filter((item) => item.round_id !== current.round_id)],
    codex_should_read: ["upload_receipt.json", "archive_manifest.json", "NEXT_FOR_CODEX.md", "ROUND_SUMMARY.md"],
    next_actor: "codex_or_reviewer",
    updated_at: createdAt.toISOString()
  };
}

export function decodeBase64Json(base64Content) {
  if (!base64Content) return null;
  try {
    const text = decodeURIComponent(escape(atob(base64Content)));
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(atob(base64Content));
    } catch {
      return null;
    }
  }
}
