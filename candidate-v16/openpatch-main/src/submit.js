import { getConfig } from "./storage.js";
import { uploadPatchFile } from "./uploader.js";
import { buildDefaultCommitTitle, formatBytes, isPatchFileName } from "./utils.js";

const params = new URLSearchParams(location.search);
const fileInput = document.querySelector("#patch-file");
const titleInput = document.querySelector("#commit-title");
const uploadButton = document.querySelector("#upload");
const statusEl = document.querySelector("#status");
const hintEl = document.querySelector("#hint");

let selectedFile = null;

const suggestedName = params.get("name") || "";
const suggestedTitle = params.get("title") || "";
hintEl.textContent = suggestedName
  ? `Choose the file suggested by ChatGPT: ${suggestedName}`
  : "Choose a .zip, .diff, or .patch file.";
titleInput.value = suggestedTitle || (suggestedName ? buildDefaultCommitTitle(suggestedName) : "");

fileInput.addEventListener("change", () => {
  selectedFile = fileInput.files?.[0] || null;
  if (!selectedFile) {
    uploadButton.disabled = true;
    return;
  }

  statusEl.textContent = `${selectedFile.name} · ${formatBytes(selectedFile.size)}`;
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
