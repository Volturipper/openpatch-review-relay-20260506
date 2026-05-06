// OPENPATCH Auto Continue adapter v9 candidate.
// Purpose: small page-level bridge; no GitHub token; no direct upload implementation.
export function requestOpenPatchRouteConflicts(project = '') {
  const requestId = `op-v9-conflicts-${Date.now()}`;
  window.dispatchEvent(new CustomEvent('openpatch:api:get-route-conflicts', { detail: { requestId, project } }));
  return requestId;
}
export function requestOpenPatchCompactSummary(project = '') {
  const requestId = `op-v9-summary-${Date.now()}`;
  window.dispatchEvent(new CustomEvent('openpatch:api:get-compact-summary', { detail: { requestId, project } }));
  return requestId;
}
export function triggerOpenPatchUploadByButton(buttonId) {
  const requestId = `op-v9-trigger-${Date.now()}`;
  window.dispatchEvent(new CustomEvent('openpatch:api:trigger-upload', { detail: { requestId, buttonId } }));
  return requestId;
}
