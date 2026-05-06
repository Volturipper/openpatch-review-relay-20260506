(function () {
  const REQUEST_EVENT = "openpatch:capture-next-download";
  const RESPONSE_SOURCE = "openpatch-page-bridge";
  const DOWNLOAD_EXTENSIONS = /\.(zip|diff|patch)(?:[?#].*)?$/i;

  let capture = null;
  const blobUrls = new Map();
  const originalCreateObjectUrl = URL.createObjectURL.bind(URL);
  const originalRevokeObjectUrl = URL.revokeObjectURL.bind(URL);
  const originalAnchorClick = HTMLAnchorElement.prototype.click;
  const originalWindowOpen = window.open;

  URL.createObjectURL = function createObjectURL(value) {
    const url = originalCreateObjectUrl(value);
    if (value instanceof Blob) {
      blobUrls.set(url, value);
    }
    return url;
  };

  URL.revokeObjectURL = function revokeObjectURL(url) {
    blobUrls.delete(url);
    return originalRevokeObjectUrl(url);
  };

  window.addEventListener(REQUEST_EVENT, (event) => {
    capture = {
      id: event.detail?.id || "",
      suggestedName: event.detail?.suggestedName || "",
      expiresAt: Date.now() + 8000,
      busy: false
    };
  });

  HTMLAnchorElement.prototype.click = function click() {
    if (tryCaptureFromAnchor(this)) {
      return undefined;
    }

    return originalAnchorClick.call(this);
  };

  window.open = function open(url, target, features) {
    if (tryCaptureUrl(url)) {
      return null;
    }

    return originalWindowOpen.call(window, url, target, features);
  };

  document.addEventListener("click", (event) => {
    const anchor = event.target?.closest?.("a[href]");
    if (!anchor) return;

    if (tryCaptureFromAnchor(anchor)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  function currentCapture() {
    if (!capture) return null;
    if (capture.busy || Date.now() > capture.expiresAt) {
      capture = null;
      return null;
    }
    return capture;
  }

  function shouldCaptureUrl(url, suggestedName = "") {
    const value = String(url || "");
    if (!value) return false;
    if (value.startsWith("blob:")) return true;
    if (DOWNLOAD_EXTENSIONS.test(value)) return true;
    if (DOWNLOAD_EXTENSIONS.test(suggestedName)) return true;
    return /download|attachment|file|sandbox/i.test(value);
  }

  function tryCaptureFromAnchor(anchor) {
    const active = currentCapture();
    if (!active) return false;

    const href = anchor?.href || anchor?.getAttribute?.("href") || "";
    const suggestedName = anchor?.download || active.suggestedName;
    if (!shouldCaptureUrl(href, suggestedName)) return false;

    captureUrl({
      url: href,
      suggestedName
    });
    return true;
  }

  function tryCaptureUrl(url) {
    const active = currentCapture();
    if (!active || !shouldCaptureUrl(url, active.suggestedName)) return false;

    captureUrl({
      url,
      suggestedName: active.suggestedName
    });
    return true;
  }

  async function captureUrl({ url, suggestedName }) {
    const active = currentCapture();
    if (!active) return;
    active.busy = true;
    const absoluteUrl = new URL(String(url), window.location.href).href;

    try {
      if (!absoluteUrl.startsWith("blob:")) {
        window.postMessage({
          source: RESPONSE_SOURCE,
          id: active.id,
          ok: true,
          fileName: pickFileName({
            suggestedName,
            url: absoluteUrl,
            contentDisposition: ""
          }),
          url: absoluteUrl
        }, window.location.origin);
        return;
      }

      const response = await readDownloadUrl(absoluteUrl);
      const fileName = pickFileName({
        suggestedName,
        url: absoluteUrl,
        contentDisposition: response.contentDisposition
      });
      const content = await arrayBufferToBase64(response.arrayBuffer);

      window.postMessage({
        source: RESPONSE_SOURCE,
        id: active.id,
        ok: true,
        fileName,
        content
      }, window.location.origin);
    } catch (error) {
      window.postMessage({
        source: RESPONSE_SOURCE,
        id: active.id,
        ok: false,
        error: error?.message || "读取附件失败。"
      }, window.location.origin);
    } finally {
      capture = null;
    }
  }

  async function readDownloadUrl(url) {
    if (String(url).startsWith("blob:") && blobUrls.has(url)) {
      const blob = blobUrls.get(url);
      return {
        arrayBuffer: await blob.arrayBuffer(),
        contentDisposition: ""
      };
    }

    const response = await fetch(url, {
      credentials: "include",
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(`下载附件失败：HTTP ${response.status}`);
    }

    return {
      arrayBuffer: await response.arrayBuffer(),
      contentDisposition: response.headers.get("content-disposition") || ""
    };
  }

  function pickFileName({ suggestedName, url, contentDisposition }) {
    const fromDisposition = parseContentDispositionFileName(contentDisposition);
    const fromSuggested = cleanFileName(suggestedName);
    const fromUrl = cleanFileName(decodeURIComponent(String(url || "").split(/[?#]/)[0].split("/").pop() || ""));
    return fromDisposition || fromSuggested || fromUrl || "openpatch.zip";
  }

  function parseContentDispositionFileName(header) {
    const value = String(header || "");
    const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match) {
      return cleanFileName(decodeURIComponent(utf8Match[1]));
    }

    const plainMatch = value.match(/filename="?([^";]+)"?/i);
    if (plainMatch) {
      return cleanFileName(plainMatch[1]);
    }

    return "";
  }

  function cleanFileName(name) {
    const value = String(name || "").trim().split(/[\\/]/).pop() || "";
    return DOWNLOAD_EXTENSIONS.test(value) ? value : "";
  }

  async function arrayBufferToBase64(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const chunkSize = 0x8000;
    let binary = "";
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }
})();
