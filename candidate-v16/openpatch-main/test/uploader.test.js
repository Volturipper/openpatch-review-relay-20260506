import assert from "node:assert/strict";
import test from "node:test";
import { uploadPatchFile, uploadPatchText } from "../src/uploader.js";

test("uploadPatchText uploads metadata first then patch to target branch", async () => {
  const calls = [];
  const result = await uploadPatchText({
    config: {
      githubToken: "token",
      owner: "afumu",
      repo: "snake-game-test",
      baseBranch: "main",
      patchDir: ".ai-patches"
    },
    fileName: "demo.diff",
    text: "diff --git a/a b/a\n",
    title: "ai: apply demo",
    now: new Date("2026-04-24T11:18:57Z"),
    githubClient: async (payload) => {
      calls.push(payload);
      return { commit: { sha: "abc123" } };
    }
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].path.endsWith(".json"), true);
  assert.equal(calls[1].path.endsWith(".diff"), true);
  assert.equal(calls[1].branch, "main");
  assert.equal(result.branchUrl, "https://github.com/afumu/snake-game-test/tree/main");
});

test("uploadPatchText resolves missing owner from GitHub token user", async () => {
  const calls = [];
  const result = await uploadPatchText({
    config: {
      githubToken: "token",
      owner: "",
      repo: "snake-game-test",
      baseBranch: "main",
      patchDir: ".ai-patches"
    },
    fileName: "demo.diff",
    text: "diff --git a/a b/a\n",
    githubUserClient: async () => ({ login: "afumu" }),
    githubClient: async (payload) => {
      calls.push(payload);
      return { commit: { sha: "abc123" } };
    }
  });

  assert.equal(calls[0].owner, "afumu");
  assert.equal(calls[1].owner, "afumu");
  assert.equal(result.repositoryUrl, "https://github.com/afumu/snake-game-test");
});

test("uploadPatchFile uploads zip as binary content", async () => {
  const calls = [];
  await uploadPatchFile({
    config: {
      githubToken: "token",
      owner: "afumu",
      repo: "snake-game-test",
      baseBranch: "main",
      patchDir: ".ai-patches"
    },
    file: {
      name: "changed-files.zip",
      async arrayBuffer() {
        return new Uint8Array([0, 1, 2, 255]).buffer;
      },
      async text() {
        throw new Error("zip should not be read as text");
      }
    },
    githubClient: async (payload) => {
      calls.push(payload);
      return { commit: { sha: "abc123" } };
    }
  });

  assert.equal(calls[1].path.endsWith(".zip"), true);
  assert.equal(calls[1].content, "AAEC/w==");
});

import { uploadRoundArchiveContent } from "../src/uploader.js";

test("uploadRoundArchiveContent uploads artifact, manifest, receipt, and latest", async () => {
  const createCalls = [];
  const upsertCalls = [];
  const result = await uploadRoundArchiveContent({
    config: {
      githubToken: "token",
      owner: "afumu",
      repo: "webai-ledger",
      baseBranch: "webai-archive",
      patchDir: ".ai-patches",
      archiveRoot: "rounds",
      indexRoot: "index",
      projectId: "webai-transfer"
    },
    fileName: "webai-roundpack.zip",
    content: "AAEC/w==",
    routeContext: {
      project: "webai-transfer",
      roundId: "round-001",
      routeId: "designer-chat-a",
      repoAlias: "archive-default",
      keyAlias: "github-archive-key"
    },
    now: new Date("2026-05-06T00:00:00Z"),
    githubClient: async (payload) => {
      createCalls.push(payload);
      return { commit: { sha: `create-${createCalls.length}` } };
    },
    githubGetClient: async () => null,
    githubUpsertClient: async (payload) => {
      upsertCalls.push(payload);
      return { commit: { sha: "latest-sha" } };
    }
  });

  assert.equal(createCalls.length, 3);
  assert.equal(createCalls[0].path, "rounds/webai-transfer/2026/05/06/round-001/webai-roundpack.zip");
  assert.equal(createCalls[1].path.endsWith("archive_manifest.json"), true);
  assert.equal(createCalls[2].path.endsWith("upload_receipt.json"), true);
  assert.equal(upsertCalls.length, 1);
  assert.equal(upsertCalls[0].path, "index/latest/webai-transfer.json");
  assert.equal(result.mode, "roundpack_archive");
  assert.equal(result.fileSha256, "3d1f57c984978ef98a18378c8166c1cb8ede02c03eeb6aee7e2f121dfeee3e56");
});
