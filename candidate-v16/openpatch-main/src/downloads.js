import { getRecentDownloads } from "./storage.js";
import { isPatchFileName } from "./utils.js";

export async function findRecentPatchDownloads(limit = 5) {
  const recent = await getRecentDownloads();
  return recent
    .filter((item) => isPatchFileName(item.filename))
    .slice(0, limit);
}

export function displayDownloadName(filename) {
  return String(filename || "").split(/[\\/]/).pop() || "patch.diff";
}

