import { clearToken, getConfig, saveConfig } from "./storage.js";
import { formatRepositoryInput } from "./utils.js";

const form = document.querySelector("#options-form");
const tokenInput = document.querySelector("#github-token");
const repositoryInput = document.querySelector("#repository");
const branchInput = document.querySelector("#base-branch");
const patchDirInput = document.querySelector("#patch-dir");
const autoOpenInput = document.querySelector("#auto-open-branch");
const projectIdInput = document.querySelector("#project-id");
const routeProfileIdInput = document.querySelector("#route-profile-id");
const repoAliasInput = document.querySelector("#repo-alias");
const keyAliasInput = document.querySelector("#key-alias");
const archiveRootInput = document.querySelector("#archive-root");
const indexRootInput = document.querySelector("#index-root");
const archiveModeDefaultInput = document.querySelector("#archive-mode-default");
const bridgeEnabledInput = document.querySelector("#bridge-enabled");
const bridgeUrlInput = document.querySelector("#bridge-url");
const bridgeHandlesUploadInput = document.querySelector("#bridge-handles-upload");
const clearTokenButton = document.querySelector("#clear-token");
const statusEl = document.querySelector("#status");
const tokenStateEl = document.querySelector("#token-state");

init();

async function init() {
  const config = await getConfig();
  tokenInput.value = config.githubToken || "";
  repositoryInput.value = formatRepositoryInput(config);
  branchInput.value = config.baseBranch;
  patchDirInput.value = config.patchDir;
  projectIdInput.value = config.projectId || "";
  routeProfileIdInput.value = config.routeProfileId || "";
  repoAliasInput.value = config.repoAlias || "";
  keyAliasInput.value = config.keyAlias || "";
  archiveRootInput.value = config.archiveRoot || "rounds";
  indexRootInput.value = config.indexRoot || "index";
  archiveModeDefaultInput.value = config.archiveModeDefault || "auto";
  bridgeEnabledInput.checked = Boolean(config.bridgeEnabled);
  bridgeUrlInput.value = config.bridgeUrl || "";
  bridgeHandlesUploadInput.checked = Boolean(config.bridgeHandlesUpload);
  autoOpenInput.checked = config.autoOpenBranch;
  tokenStateEl.textContent = config.githubToken ? "已配置" : "未配置";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveConfig({
    githubToken: tokenInput.value,
    repository: repositoryInput.value,
    baseBranch: branchInput.value,
    patchDir: patchDirInput.value,
    projectId: projectIdInput.value,
    routeProfileId: routeProfileIdInput.value,
    repoAlias: repoAliasInput.value,
    keyAlias: keyAliasInput.value,
    archiveRoot: archiveRootInput.value,
    indexRoot: indexRootInput.value,
    archiveModeDefault: archiveModeDefaultInput.value,
    bridgeEnabled: bridgeEnabledInput.checked,
    bridgeUrl: bridgeUrlInput.value,
    bridgeHandlesUpload: bridgeHandlesUploadInput.checked,
    autoOpenBranch: autoOpenInput.checked
  });
  statusEl.textContent = "设置已保存。";
  tokenStateEl.textContent = tokenInput.value ? "已配置" : "未配置";
});

clearTokenButton.addEventListener("click", async () => {
  await clearToken();
  tokenInput.value = "";
  tokenStateEl.textContent = "未配置";
  statusEl.textContent = "Token 已清除。";
});

