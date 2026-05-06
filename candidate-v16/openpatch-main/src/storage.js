import { DEFAULT_CONFIG, parseRepositoryInput } from "./utils.js";

const CONFIG_KEY = "openpatchConfig";
const RECENT_DOWNLOADS_KEY = "openpatchRecentDownloads";
const MAX_RECENT_DOWNLOADS = 8;

export async function getConfig() {
  const result = await chrome.storage.local.get(CONFIG_KEY);
  return {
    ...DEFAULT_CONFIG,
    ...(result[CONFIG_KEY] || {})
  };
}

export async function saveConfig(input) {
  const repository = parseRepositoryInput(input.repository || `${input.owner || ""}/${input.repo || ""}`);
  const config = {
    ...DEFAULT_CONFIG,
    ...(await getConfig()),
    githubToken: String(input.githubToken || "").trim(),
    owner: repository.owner,
    repo: repository.repo,
    baseBranch: String(input.baseBranch || DEFAULT_CONFIG.baseBranch).trim(),
    patchDir: String(input.patchDir || DEFAULT_CONFIG.patchDir).trim(),
    autoOpenBranch: Boolean(input.autoOpenBranch),
    mode: String(input.mode || DEFAULT_CONFIG.mode).trim(),
    projectId: String(input.projectId || input.project_id || DEFAULT_CONFIG.projectId).trim(),
    routeProfileId: String(input.routeProfileId || input.route_profile_id || DEFAULT_CONFIG.routeProfileId).trim(),
    repoAlias: String(input.repoAlias || input.repo_alias || DEFAULT_CONFIG.repoAlias).trim(),
    keyAlias: String(input.keyAlias || input.key_alias || DEFAULT_CONFIG.keyAlias).trim(),
    bridgeEnabled: Boolean(input.bridgeEnabled || input.bridge_enabled),
    bridgeUrl: String(input.bridgeUrl || input.bridge_url || DEFAULT_CONFIG.bridgeUrl).trim(),
    bridgeHandlesUpload: Boolean(input.bridgeHandlesUpload ?? input.bridge_handles_upload ?? DEFAULT_CONFIG.bridgeHandlesUpload),
    archiveRoot: String(input.archiveRoot || input.archive_root || DEFAULT_CONFIG.archiveRoot).trim(),
    indexRoot: String(input.indexRoot || input.index_root || DEFAULT_CONFIG.indexRoot).trim(),
    archiveModeDefault: String(input.archiveModeDefault || input.archive_mode_default || DEFAULT_CONFIG.archiveModeDefault).trim(),
    maxArchiveSizeMb: Number(input.maxArchiveSizeMb || input.max_archive_size_mb || DEFAULT_CONFIG.maxArchiveSizeMb)
  };

  await chrome.storage.local.set({ [CONFIG_KEY]: config });
  return config;
}

export async function clearToken() {
  const config = await getConfig();
  config.githubToken = "";
  await chrome.storage.local.set({ [CONFIG_KEY]: config });
}

export async function getRecentDownloads() {
  const result = await chrome.storage.local.get(RECENT_DOWNLOADS_KEY);
  return result[RECENT_DOWNLOADS_KEY] || [];
}

export async function savePatchDownload(download) {
  const recent = await getRecentDownloads();
  const next = [
    {
      id: download.id,
      filename: download.filename,
      url: download.finalUrl || download.url || "",
      createdAt: new Date().toISOString(),
      state: download.state || "complete"
    },
    ...recent.filter((item) => item.id !== download.id)
  ].slice(0, MAX_RECENT_DOWNLOADS);

  await chrome.storage.local.set({ [RECENT_DOWNLOADS_KEY]: next });
  return next;
}

