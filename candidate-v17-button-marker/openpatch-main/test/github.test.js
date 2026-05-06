import assert from "node:assert/strict";
import test from "node:test";
import { buildContentsApiUrl, encodeGitHubPath } from "../src/github.js";

test("encodeGitHubPath preserves path separators and escapes segments", () => {
  assert.equal(encodeGitHubPath(".ai-patches/a b.diff"), ".ai-patches/a%20b.diff");
});

test("buildContentsApiUrl encodes repository and path", () => {
  assert.equal(
    buildContentsApiUrl({
      owner: "afumu",
      repo: "snake-game-test",
      path: ".ai-patches/a b.diff"
    }),
    "https://api.github.com/repos/afumu/snake-game-test/contents/.ai-patches/a%20b.diff"
  );
});

