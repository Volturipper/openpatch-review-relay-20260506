import { displayDownloadName, findRecentPatchDownloads } from "./downloads.js";
import { getConfig } from "./storage.js";
import { uploadPatchFile } from "./uploader.js";
import { buildDefaultCommitTitle, formatBytes, formatRepositoryInput, isPatchFileName, validateConfig } from "./utils.js";

const fileInput = document.querySelector("#patch-file");
const titleInput = document.querySelector("#commit-title");
const uploadButton = document.querySelector("#upload");
const settingsButton = document.querySelector("#settings");
const repositoryEl = document.querySelector("#repository");
const branchEl = document.querySelector("#branch");
const statusEl = document.querySelector("#status");
const recentEl = document.querySelector("#recent");
const fileMetaEl = document.querySelector("#file-meta");

let selectedFile = null;

init();

async function init() {
  const config = await getConfig();
  repositoryEl.textContent = formatRepositoryInput(config) || "Not configured";
  branchEl.textContent = config.baseBranch || "main";

  const validation = validateConfig(config);
  if (!validation.ok) {
    statusEl.textContent = `请先配置：${validation.missing.join("、")}`;
  }

  const recent = await findRecentPatchDownloads();
  recentEl.innerHTML = "";
  if (recent.length === 0) {
    recentEl.textContent = "No recent OpenPatch downloads detected. You can still select a file manually.";
  } else {
    for (const item of recent) {
      const row = document.createElement("li");
      row.textContent = displayDownloadName(item.filename);
      recentEl.append(row);
    }
  }
}

fileInput.addEventListener("change", () => {
  selectedFile = fileInput.files?.[0] || null;
  if (!selectedFile) {
    fileMetaEl.textContent = "";
    uploadButton.disabled = true;
    return;
  }

  fileMetaEl.textContent = `${selectedFile.name} · ${formatBytes(selectedFile.size)}`;
  uploadButton.disabled = !isPatchFileName(selectedFile.name);
  if (!titleInput.value.trim()) {
    titleInput.value = buildDefaultCommitTitle(selectedFile.name);
  }
});

uploadButton.addEventListener("click", async () => {
  if (!selectedFile) return;
  uploadButton.disabled = true;
  statusEl.textContent = "Uploading file...";

  try {
    const config = await getConfig();
    const result = await uploadPatchFile({
      config,
      file: selectedFile,
      title: titleInput.value
    });

    statusEl.textContent = `Upload complete: ${result.path}. The workflow will apply it.`;
    if (config.autoOpenBranch) {
      chrome.tabs.create({ url: result.branchUrl });
    }
  } catch (error) {
    statusEl.textContent = error.message;
    uploadButton.disabled = false;
  }
});

settingsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
