// OpenPatch Agent Gateway v8 - Auto Continue bridge adapter candidate.
// Purpose: keep Auto Continue fast while letting OpenPatch/Gateway handle archive status.
// This file is intentionally small and token-light for local Codex/agent review.
(function () {
  const DEFAULT_INTERVAL = 5;
  const DEFAULT_MAX_WAIT_MS = 20_000;
  const state = {
    messageCount: 0,
    project: "default",
    waitingForRoundPack: false,
    waitingForArchiveReceipt: false,
    lastRoundPackMarker: null,
    lastArchiveReceipt: null,
    lastCompactSummary: null,
    lastError: null
  };

  function requestEvent({ requestEvent, responseEvent, detail = {}, timeoutMs = 3000 }) {
    return new Promise((resolve) => {
      const requestId = detail.requestId || `op-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      function onResponse(event) {
        const payload = event.detail || {};
        if (payload.requestId && payload.requestId !== requestId) return;
        window.removeEventListener(responseEvent, onResponse);
        resolve(payload);
      }
      window.addEventListener(responseEvent, onResponse);
      window.dispatchEvent(new CustomEvent(requestEvent, { detail: { ...detail, requestId } }));
      window.setTimeout(() => {
        window.removeEventListener(responseEvent, onResponse);
        resolve({ ok: false, status: "timeout", requestId, requestEvent, project: detail.project || state.project });
      }, timeoutMs);
    });
  }

  function getCompactSummary(project = state.project) {
    return requestEvent({
      requestEvent: "openpatch:api:get-compact-summary",
      responseEvent: "openpatch:api:compact-summary",
      detail: { project },
      timeoutMs: 3000
    }).then((summary) => {
      state.lastCompactSummary = summary;
      return summary;
    });
  }

  function getRoundPackPrompt(project = state.project) {
    return requestEvent({
      requestEvent: "openpatch:api:get-roundpack-prompt",
      responseEvent: "openpatch:api:roundpack-prompt",
      detail: { project },
      timeoutMs: 3000
    }).then((detail) => detail.prompt || "");
  }

  function parseRoundPackMarker(text) {
    const match = String(text || "").match(/\[ROUND_PACK_READY\]([\s\S]*?)\[\/ROUND_PACK_READY\]/i);
    if (!match) return null;
    const out = {};
    for (const line of match[1].split(/\r?\n/)) {
      const m = line.match(/^\s*([a-zA-Z0-9_.-]+)\s*:\s*(.*?)\s*$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  }

  function triggerArchive({ fileName = "webai-roundpack.zip", buttonId = "", allowStale = false } = {}) {
    const requestId = `op-upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.dispatchEvent(new CustomEvent("openpatch:api:trigger-upload", { detail: { requestId, fileName, buttonId, allowStale } }));
    state.waitingForArchiveReceipt = true;
    return requestId;
  }

  async function beforeContinue({ project = state.project, messageCount = state.messageCount, interval = DEFAULT_INTERVAL, force = false } = {}) {
    state.project = project;
    state.messageCount = messageCount;
    const summary = await getCompactSummary(project);
    const queueCounts = summary?.queue_counts || {};
    if (state.waitingForArchiveReceipt || queueCounts.claimed || queueCounts.queued) {
      return { action: "pause", reason: "archive_or_queue_pending", summary };
    }
    const shouldRequest = force || (messageCount > 0 && messageCount % Math.max(1, interval) === 0);
    if (!shouldRequest) return { action: "continue", summary };
    const prompt = await getRoundPackPrompt(project);
    state.waitingForRoundPack = true;
    return { action: "send_prompt", prompt, reason: force ? "forced_roundpack" : "roundpack_interval", summary };
  }

  window.addEventListener("openpatch:agent-status", (event) => {
    const detail = event.detail || {};
    if (detail.status === "uploaded") {
      state.waitingForArchiveReceipt = false;
      state.lastArchiveReceipt = detail.result || detail;
    }
    if (detail.status === "failed") {
      state.waitingForArchiveReceipt = false;
      state.lastError = detail.error || detail;
    }
  });

  window.OpenPatchAutoContinueBridge = {
    version: "v8",
    state,
    beforeContinue,
    getCompactSummary,
    getRoundPackPrompt,
    triggerArchive,
    parseRoundPackMarker,
    onAssistantText(text) {
      const marker = parseRoundPackMarker(text);
      if (marker) {
        state.lastRoundPackMarker = marker;
        state.waitingForRoundPack = false;
      }
      return marker;
    },
    waitForArchiveReceipt(timeoutMs = DEFAULT_MAX_WAIT_MS) {
      if (!state.waitingForArchiveReceipt) return Promise.resolve({ ok: true, status: "not_waiting", receipt: state.lastArchiveReceipt });
      return new Promise((resolve) => {
        const started = Date.now();
        const timer = window.setInterval(() => {
          if (!state.waitingForArchiveReceipt || Date.now() - started > timeoutMs) {
            window.clearInterval(timer);
            resolve({ ok: !state.waitingForArchiveReceipt, status: state.waitingForArchiveReceipt ? "timeout" : "received", receipt: state.lastArchiveReceipt, error: state.lastError });
          }
        }, 500);
      });
    }
  };
})();
