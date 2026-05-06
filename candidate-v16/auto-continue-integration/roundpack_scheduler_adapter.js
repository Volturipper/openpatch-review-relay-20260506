// OpenPatch Agent Gateway v7 - Auto Continue bridge adapter candidate.
// Paste/import into the Auto Continue controller layer, not into random page code.
// It uses page events only; it does not store GitHub tokens and does not call GitHub directly.
(function () {
  const DEFAULT_INTERVAL = 5;
  const state = {
    messageCount: 0,
    project: "default",
    waitingForRoundPack: false,
    waitingForArchiveReceipt: false,
    lastRoundPackMarker: null,
    lastArchiveReceipt: null
  };

  function askOpenPatchForPlan({ project = state.project, messageCount = state.messageCount, force = false } = {}) {
    return new Promise((resolve) => {
      const requestId = `op-plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      function onResponse(event) {
        const detail = event.detail || {};
        if (detail.requestId && detail.requestId !== requestId) return;
        window.removeEventListener("openpatch:api:agent-summary", onResponse);
        resolve(detail);
      }
      window.addEventListener("openpatch:api:agent-summary", onResponse);
      window.dispatchEvent(new CustomEvent("openpatch:api:get-agent-summary", { detail: { requestId, project } }));
      window.setTimeout(() => {
        window.removeEventListener("openpatch:api:agent-summary", onResponse);
        resolve({ status: "timeout", project, messageCount, force });
      }, 3000);
    });
  }

  function getRoundPackPrompt(project = state.project) {
    return new Promise((resolve) => {
      const requestId = `op-prompt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      function onResponse(event) {
        const detail = event.detail || {};
        if (detail.requestId && detail.requestId !== requestId) return;
        window.removeEventListener("openpatch:api:roundpack-prompt", onResponse);
        resolve(detail.prompt || "");
      }
      window.addEventListener("openpatch:api:roundpack-prompt", onResponse);
      window.dispatchEvent(new CustomEvent("openpatch:api:get-roundpack-prompt", { detail: { requestId, project } }));
      window.setTimeout(() => {
        window.removeEventListener("openpatch:api:roundpack-prompt", onResponse);
        resolve("");
      }, 3000);
    });
  }

  function parseRoundPackMarker(text) {
    const match = String(text || "").match(/\[ROUND_PACK_READY\]([\s\S]*?)\[\/ROUND_PACK_READY\]/i);
    if (!match) return null;
    const body = match[1];
    const out = {};
    for (const line of body.split(/\r?\n/)) {
      const m = line.match(/^\s*([a-zA-Z0-9_.-]+)\s*:\s*(.*?)\s*$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  }

  function maybeTriggerArchive(fileName = "webai-roundpack.zip") {
    const requestId = `op-upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.dispatchEvent(new CustomEvent("openpatch:api:trigger-upload", { detail: { requestId, fileName } }));
    state.waitingForArchiveReceipt = true;
    return requestId;
  }

  window.addEventListener("openpatch:agent-status", (event) => {
    const detail = event.detail || {};
    if (detail.status === "uploaded") {
      state.waitingForArchiveReceipt = false;
      state.lastArchiveReceipt = detail.result || detail;
    }
  });

  window.OpenPatchAutoContinueBridge = {
    state,
    onAssistantText(text) {
      const marker = parseRoundPackMarker(text);
      if (marker) {
        state.lastRoundPackMarker = marker;
        state.waitingForRoundPack = false;
      }
      return marker;
    },
    async beforeContinue({ project = state.project, messageCount = state.messageCount, interval = DEFAULT_INTERVAL } = {}) {
      state.project = project;
      state.messageCount = messageCount;
      const shouldRequest = messageCount > 0 && messageCount % Math.max(1, interval) === 0;
      if (!shouldRequest) return { action: "continue" };
      const prompt = await getRoundPackPrompt(project);
      state.waitingForRoundPack = true;
      return { action: "send_prompt", prompt, reason: "roundpack_interval" };
    },
    triggerArchive: maybeTriggerArchive,
    getRoundPackPrompt,
    askOpenPatchForPlan
  };
})();
