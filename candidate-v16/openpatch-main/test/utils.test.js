import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPatchMetadataPath,
  buildPatchUploadPath,
  buildDefaultCommitTitle,
  encodeBase64Bytes,
  getUploadFileExtension,
  looksLikePatchDownloadText,
  parseRepositoryInput,
  sanitizePatchName
} from "../src/utils.js";

test("parseRepositoryInput accepts owner/repo and GitHub URLs", () => {
  assert.deepEqual(parseRepositoryInput("afumu/snake-game-test"), {
    owner: "afumu",
    repo: "snake-game-test"
  });
  assert.deepEqual(parseRepositoryInput("https://github.com/afumu/snake-game-test.git"), {
    owner: "afumu",
    repo: "snake-game-test"
  });
  assert.deepEqual(parseRepositoryInput("snake-game-test"), {
    owner: "",
    repo: "snake-game-test"
  });
});

test("looksLikePatchDownloadText detects loose Chinese diff labels", () => {
  assert.equal(looksLikePatchDownloadText("轻量样式优化 diff 文件"), true);
  assert.equal(looksLikePatchDownloadText("整体补丁文件 snake-game-style-upgrade.diff"), true);
  assert.equal(looksLikePatchDownloadText("changed-files.zip"), true);
  assert.equal(looksLikePatchDownloadText("按文件拆分的 diff 压缩包 snake-game-diff-files.zip"), true);
  assert.equal(looksLikePatchDownloadText("修改后的文件包"), true);
  assert.equal(looksLikePatchDownloadText("source.tar.gz"), false);
});

test("buildPatchUploadPath creates safe unique paths", () => {
  const path = buildPatchUploadPath({
    patchDir: ".ai-patches/",
    originalName: "Snake Game Style.diff",
    now: new Date(2026, 3, 24, 19, 18, 57),
    randomId: "5410"
  });

  assert.equal(path, ".ai-patches/snake-game-style-20260424-191857-5410.diff");
  assert.equal(buildPatchMetadataPath(path), ".ai-patches/snake-game-style-20260424-191857-5410.json");
});

test("zip upload paths and metadata paths are supported", () => {
  const path = buildPatchUploadPath({
    patchDir: ".ai-patches",
    originalName: "changed-files.zip",
    extension: "zip",
    now: new Date(2026, 3, 24, 19, 18, 57),
    randomId: "abcd"
  });

  assert.equal(path, ".ai-patches/changed-files-20260424-191857-abcd.zip");
  assert.equal(buildPatchMetadataPath(path), ".ai-patches/changed-files-20260424-191857-abcd.json");
  assert.equal(getUploadFileExtension("changed-files.zip"), "zip");
});

test("buildDefaultCommitTitle distinguishes zip packages", () => {
  assert.equal(
    buildDefaultCommitTitle("changed-files.zip"),
    "ai: apply changed files package changed-files.zip"
  );
  assert.equal(buildDefaultCommitTitle("fix.diff"), "ai: apply fix.diff");
});

test("encodeBase64Bytes encodes binary data", () => {
  const bytes = new Uint8Array([0, 1, 2, 255]).buffer;
  assert.equal(encodeBase64Bytes(bytes), "AAEC/w==");
});

test("sanitizePatchName keeps fallback usable", () => {
  assert.equal(sanitizePatchName("   "), "ai-patch");
});

import {
  buildLatestIndexPath,
  buildRoundArchivePath,
  buildRoundReceiptPath,
  isArchiveFileName,
  looksLikeRoundPackDownloadText,
  sanitizeArchiveFileName,
  shouldUseArchiveMode
} from "../src/utils.js";

test("roundpack helpers detect archive artifacts and build safe paths", () => {
  assert.equal(looksLikeRoundPackDownloadText("webai-roundpack.zip"), true);
  assert.equal(looksLikeRoundPackDownloadText("审核包 audit-pack.zip"), true);
  assert.equal(isArchiveFileName("webai-roundpack.zip"), true);
  assert.equal(isArchiveFileName("secret.exe"), false);
  assert.equal(shouldUseArchiveMode({ fileName: "webai-roundpack.zip", label: "download", configuredMode: "auto" }), true);
  assert.equal(sanitizeArchiveFileName("../bad name.zip"), "bad-name.zip");

  const path = buildRoundArchivePath({
    root: "rounds",
    project: "WebAI Transfer",
    roundId: "Round 001",
    fileName: "webai-roundpack.zip",
    now: new Date("2026-05-06T00:00:00Z")
  });
  assert.equal(path, "rounds/webai-transfer/2026/05/06/round-001/webai-roundpack.zip");
  assert.equal(buildRoundReceiptPath(path), "rounds/webai-transfer/2026/05/06/round-001/upload_receipt.json");
  assert.equal(buildLatestIndexPath({ indexRoot: "index", project: "WebAI Transfer" }), "index/latest/webai-transfer.json");
});
