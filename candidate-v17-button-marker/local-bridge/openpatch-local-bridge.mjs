#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const PORT = Number(process.env.OPENPATCH_BRIDGE_PORT || 17873);
const ROOT = path.resolve(process.env.OPENPATCH_BRIDGE_ROOT || "./openpatch-bridge-data");
const ROUTES_FILE = path.resolve(process.env.OPENPATCH_ROUTES_FILE || path.join(ROOT, "route_profiles.json"));
const REPOS_FILE = path.resolve(process.env.OPENPATCH_REPOS_FILE || path.join(ROOT, "repo_aliases.json"));
const KEYS_FILE = path.resolve(process.env.OPENPATCH_KEYS_FILE || path.join(ROOT, "keys.local.json"));
const RECEIPTS_DIR = path.join(ROOT, "receipts");
const LATEST_DIR = path.join(ROOT, "latest");
const QUEUE_FILE = path.join(ROOT, "queue.json");
const STATUS_FILE = path.join(ROOT, "status.json");
const SHA_INDEX_FILE = path.join(ROOT, "sha_index.json");
const EVENTS_FILE = path.join(ROOT, "events.jsonl");
const INSTANCES_FILE = path.join(ROOT, "instances.json");
const LOCKS = new Map();
const DEFAULT_LEASE_MS = Math.max(60_000, Number(process.env.OPENPATCH_QUEUE_LEASE_MS || 15 * 60 * 1000));
const GITHUB_MIN_INTERVAL_MS = Math.max(0, Number(process.env.OPENPATCH_GITHUB_MIN_INTERVAL_MS || 250));
const GITHUB_MAX_RETRIES = Math.max(0, Math.min(8, Number(process.env.OPENPATCH_GITHUB_MAX_RETRIES || 4)));
const GITHUB_RETRY_BASE_MS = Math.max(100, Number(process.env.OPENPATCH_GITHUB_RETRY_BASE_MS || 750));
const MAX_ARCHIVE_BYTES = Math.max(1_000_000, Number(process.env.OPENPATCH_MAX_ARCHIVE_BYTES || 95 * 1024 * 1024));
const MAX_EVENTS = Math.max(100, Number(process.env.OPENPATCH_MAX_EVENTS || 2000));
const ROUTE_AMBIGUITY_GAP = Math.max(0, Number(process.env.OPENPATCH_ROUTE_AMBIGUITY_GAP || 10));
const GITHUB_RATE_STATE = { last_request_at: 0, in_flight: 0, total_requests: 0, retry_count: 0, last_status: 0, last_error: '', rate_limit: null, updated_at: '' };

async function ensureRoot() {
  await fs.mkdir(RECEIPTS_DIR, { recursive: true });
  await fs.mkdir(LATEST_DIR, { recursive: true });
  await ensureJsonFile(ROUTES_FILE, { schema_version: "openpatch.route_profiles.v1", profiles: [] });
  await ensureJsonFile(REPOS_FILE, {
    schema_version: "openpatch.repo_aliases.v1",
    repos: [
      {
        repo_alias: "example-dry-run-archive",
        provider: "github",
        owner: "example-owner",
        repo: "example-archive-repo",
        branch: "webai-archive",
        archive_root: "rounds",
        index_root: "index",
        dry_run: true
      }
    ]
  });
  await ensureJsonFile(KEYS_FILE, {
    schema_version: "openpatch.keys.local.v1",
    keys: [
      {
        key_alias: "example-gh-token-env",
        provider: "github",
        token_env: "GITHUB_TOKEN_FOR_OPENPATCH_ARCHIVE"
      }
    ]
  });
  await ensureJsonFile(STATUS_FILE, {
    schema_version: "openpatch.bridge_status.v10",
    receipts: [],
    updated_at: new Date().toISOString()
  });
  await ensureJsonFile(QUEUE_FILE, {
    schema_version: "openpatch.bridge_queue.v2",
    items: [],
    updated_at: new Date().toISOString()
  });
  await ensureJsonFile(SHA_INDEX_FILE, {
    schema_version: "openpatch.sha_index.v1",
    entries: [],
    updated_at: new Date().toISOString()
  });
}

async function ensureJsonFile(file, fallback) {
  try { await fs.access(file); } catch { await writeJsonAtomic(file, fallback); }
}

async function readJson(file, fallback = null) {
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch { return fallback; }
}

async function writeJsonAtomic(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`);
  await fs.rename(tmp, file);
}

async function appendEvent(type, detail = {}) {
  await fs.mkdir(path.dirname(EVENTS_FILE), { recursive: true });
  const event = {
    schema_version: "openpatch.bridge_event.v1",
    type: safeString(type, 120),
    detail,
    created_at: nowIso()
  };
  await fs.appendFile(EVENTS_FILE, `${JSON.stringify(event)}\n`);
  if (Math.random() < 0.05) await compactEvents(MAX_EVENTS).catch(() => null);
  return event;
}

async function readRecentEvents(limit = 50) {
  try {
    const text = await fs.readFile(EVENTS_FILE, "utf8");
    return text.trim().split(/\n+/).filter(Boolean).slice(-Number(limit || 50)).map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

async function compactEvents(limit = MAX_EVENTS) {
  return withLock("events", async () => {
    let lines = [];
    try { lines = (await fs.readFile(EVENTS_FILE, "utf8")).trim().split(/\n+/).filter(Boolean); } catch { lines = []; }
    const keep = lines.slice(-Math.max(100, Number(limit || MAX_EVENTS)));
    await fs.mkdir(path.dirname(EVENTS_FILE), { recursive: true });
    await fs.writeFile(EVENTS_FILE, keep.length ? `${keep.join("\n")}\n` : "");
    return { ok: true, schema_version: "openpatch.events_compact.v8", before: lines.length, after: keep.length, max_events: Number(limit || MAX_EVENTS), compacted_at: nowIso() };
  });
}

async function withLock(name, fn) {
  const previous = LOCKS.get(name) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => { release = resolve; });
  LOCKS.set(name, previous.then(() => current));
  await previous;
  try { return await fn(); } finally {
    release();
    if (LOCKS.get(name) === current) LOCKS.delete(name);
  }
}

function jsonResponse(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(`${JSON.stringify(body, null, 2)}\n`);
}

function safeId(value, fallback = "item") {
  return String(value || fallback)
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .toLowerCase() || fallback;
}

function safeString(value, max = 500) { return String(value || "").slice(0, max); }
function nowIso() { return new Date().toISOString(); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function jitter(ms) { return Math.floor(ms + Math.random() * Math.max(50, ms * 0.25)); }
function base64SizeBytes(base64) {
  const clean = String(base64 || '').replace(/\s/g, '');
  if (!clean) return 0;
  const padding = clean.endsWith('==') ? 2 : (clean.endsWith('=') ? 1 : 0);
  return Math.max(0, Math.floor(clean.length * 3 / 4) - padding);
}
function githubRateStatus() {
  return { ok: true, schema_version: 'openpatch.github_rate_status.v8', ...GITHUB_RATE_STATE, updated_at: GITHUB_RATE_STATE.updated_at || nowIso() };
}
function updateGithubRateState(response, error = '') {
  GITHUB_RATE_STATE.last_status = response?.status || 0;
  GITHUB_RATE_STATE.last_error = safeString(error, 300);
  GITHUB_RATE_STATE.updated_at = nowIso();
  if (response?.headers) {
    GITHUB_RATE_STATE.rate_limit = {
      limit: response.headers.get('x-ratelimit-limit') || '',
      remaining: response.headers.get('x-ratelimit-remaining') || '',
      reset: response.headers.get('x-ratelimit-reset') || '',
      resource: response.headers.get('x-ratelimit-resource') || ''
    };
  }
}
function shouldRetryGitHub(response, error = null) {
  if (error) return true;
  if (!response) return false;
  return response.status === 403 || response.status === 429 || response.status >= 500;
}
async function githubFetchWithBackoff(url, options = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= GITHUB_MAX_RETRIES; attempt += 1) {
    const waitForSlot = Math.max(0, GITHUB_MIN_INTERVAL_MS - (Date.now() - GITHUB_RATE_STATE.last_request_at));
    if (waitForSlot) await sleep(waitForSlot);
    GITHUB_RATE_STATE.last_request_at = Date.now();
    GITHUB_RATE_STATE.in_flight += 1;
    GITHUB_RATE_STATE.total_requests += 1;
    try {
      const response = await fetch(url, options);
      updateGithubRateState(response);
      GITHUB_RATE_STATE.in_flight -= 1;
      if (!shouldRetryGitHub(response) || attempt >= GITHUB_MAX_RETRIES) return response;
      GITHUB_RATE_STATE.retry_count += 1;
      const retryAfter = Number(response.headers.get('retry-after') || 0) * 1000;
      const waitMs = retryAfter || jitter(GITHUB_RETRY_BASE_MS * (2 ** attempt));
      await appendEvent('github_retry_backoff', { attempt: attempt + 1, status: response.status, wait_ms: waitMs });
      await sleep(waitMs);
    } catch (error) {
      lastError = error;
      updateGithubRateState(null, error.message);
      GITHUB_RATE_STATE.in_flight -= 1;
      if (attempt >= GITHUB_MAX_RETRIES) throw error;
      GITHUB_RATE_STATE.retry_count += 1;
      const waitMs = jitter(GITHUB_RETRY_BASE_MS * (2 ** attempt));
      await appendEvent('github_retry_backoff', { attempt: attempt + 1, error: error.message, wait_ms: waitMs });
      await sleep(waitMs);
    }
  }
  throw lastError || new Error('github_fetch_retry_exhausted');
}
function hostOnly(url) { try { return new URL(String(url || "")).host; } catch { return ""; } }
function sha256Text(text) { return crypto.createHash("sha256").update(String(text || "")).digest("hex"); }
function sha256Base64(base64) { return crypto.createHash("sha256").update(Buffer.from(String(base64 || ""), "base64")).digest("hex"); }
function encodeBase64Utf8(text) { return Buffer.from(String(text ?? ""), "utf8").toString("base64"); }
function decodeBase64Json(base64Content) {
  if (!base64Content) return null;
  try { return JSON.parse(Buffer.from(String(base64Content).replace(/\n/g, ""), "base64").toString("utf8")); } catch { return null; }
}

async function collectBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text.trim()) return {};
  return JSON.parse(text);
}

function pickMatchText(body) {
  return `${body.page_url || body.url || ""}\n${body.title || body.page_title || ""}\n${body.project_hint || body.project || ""}`.toLowerCase();
}

function arrayIncludesAny(haystack, values) {
  if (!Array.isArray(values)) return false;
  return values.some((value) => String(value || "") && haystack.includes(String(value).toLowerCase()));
}

function profileScore(profile, body) {
  const match = profile.match || {};
  const text = pickMatchText(body);
  let score = Number(profile.priority || 0);
  if (body.project_hint && safeId(body.project_hint) === safeId(profile.project)) score += 25;
  if (body.route_profile && safeId(body.route_profile) === safeId(profile.profile_id || profile.route_profile)) score += 100;
  if (arrayIncludesAny(text, match.url_contains)) score += 20;
  if (arrayIncludesAny(text, match.title_contains)) score += 15;
  if (arrayIncludesAny(String(body.page_url || body.url || "").toLowerCase(), match.host_contains)) score += 20;
  if (Array.isArray(match.url_regex)) {
    for (const pattern of match.url_regex) {
      try { if (new RegExp(pattern, "i").test(String(body.page_url || body.url || ""))) score += 30; }
      catch { score -= 10; }
    }
  }
  return score;
}


function normalizeProfileId(profile, index = 0) {
  return safeString(profile.profile_id || profile.route_profile || `profile-${index}`, 160);
}

function summarizeProfile(profile, index = 0) {
  const match = profile.match || {};
  return {
    profile_id: normalizeProfileId(profile, index),
    project: safeId(profile.project || '', ''),
    repo_alias: safeString(profile.repo_alias || '', 120),
    key_alias: safeString(profile.key_alias || '', 120),
    priority: Number(profile.priority || 0),
    default: Boolean(profile.default),
    match_fingerprint: sha256Text(JSON.stringify({
      url_contains: match.url_contains || [],
      title_contains: match.title_contains || [],
      host_contains: match.host_contains || [],
      url_regex: match.url_regex || []
    })).slice(0, 16)
  };
}

async function detectRouteConflicts(body = {}) {
  const routes = await readJson(ROUTES_FILE, { profiles: [] });
  const profiles = Array.isArray(routes.profiles) ? routes.profiles : [];
  const issues = [];
  const seenIds = new Map();
  const seenFingerprints = new Map();
  let defaultCount = 0;

  profiles.forEach((profile, index) => {
    const summary = summarizeProfile(profile, index);
    if (summary.default) defaultCount += 1;
    if (!summary.repo_alias) issues.push({ severity: 'warning', type: 'missing_repo_alias', profile: summary });
    if (!summary.key_alias) issues.push({ severity: 'warning', type: 'missing_key_alias', profile: summary });
    if (seenIds.has(summary.profile_id)) {
      issues.push({ severity: 'error', type: 'duplicate_profile_id', profiles: [seenIds.get(summary.profile_id), summary] });
    } else {
      seenIds.set(summary.profile_id, summary);
    }
    const fpKey = `${summary.project || 'any'}:${summary.match_fingerprint}`;
    if (seenFingerprints.has(fpKey)) {
      issues.push({ severity: 'warning', type: 'same_project_same_match_fingerprint', profiles: [seenFingerprints.get(fpKey), summary] });
    } else {
      seenFingerprints.set(fpKey, summary);
    }
  });

  if (defaultCount > 1) issues.push({ severity: 'error', type: 'multiple_default_profiles', count: defaultCount });

  let dynamic = null;
  if (body && Object.keys(body).length) {
    const scored = profiles
      .map((profile, index) => ({ profile: summarizeProfile(profile, index), score: profileScore(profile, body) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
    const top = scored[0] || null;
    const second = scored[1] || null;
    const scoreGap = top && second ? top.score - second.score : null;
    const ambiguous = Boolean(top && second && scoreGap <= ROUTE_AMBIGUITY_GAP);
    if (ambiguous) {
      issues.push({ severity: 'warning', type: 'ambiguous_route_resolution', top_score: top.score, second_score: second.score, score_gap: scoreGap, candidates: scored.slice(0, 5) });
    }
    dynamic = { input: { project_hint: safeString(body.project_hint || body.project || '', 120), page_url_host: hostOnly(body.page_url || body.url || ''), title: safeString(body.title || body.page_title || '', 160) }, top_candidates: scored.slice(0, 5), score_gap: scoreGap, ambiguous };
  }

  return {
    ok: true,
    schema_version: 'openpatch.route_conflicts.v10',
    total_profiles: profiles.length,
    issue_count: issues.length,
    has_blocking_conflict: issues.some((issue) => issue.severity === 'error'),
    recommended_agent_action: issues.some((issue) => issue.severity === 'error') ? 'fix_route_profiles_before_upload' : (issues.length ? 'review_route_warnings_or_continue' : 'route_profiles_ok'),
    issues,
    dynamic,
    checked_at: nowIso()
  };
}


function profileMatchSummary(profile) {
  const match = profile.match || {};
  return {
    url_contains: Array.isArray(match.url_contains) ? match.url_contains.slice(0, 8) : [],
    title_contains: Array.isArray(match.title_contains) ? match.title_contains.slice(0, 8) : [],
    host_contains: Array.isArray(match.host_contains) ? match.host_contains.slice(0, 8) : [],
    url_regex_count: Array.isArray(match.url_regex) ? match.url_regex.length : 0
  };
}

function routeVisualNode(profile, index = 0) {
  const summary = summarizeProfile(profile, index);
  return {
    ...summary,
    browser_profile: safeString(profile.browser_profile || profile.browserProfile || '', 160),
    chat_group: safeString(profile.chat_group || profile.chatGroup || '', 160),
    agent_group: safeString(profile.agent_group || profile.agentGroup || '', 160),
    mode: safeString(profile.mode || 'roundpack_archive', 80),
    archive_root: safeString(profile.archive_root || 'rounds', 120),
    index_root: safeString(profile.index_root || 'index', 120),
    match: profileMatchSummary(profile),
    route_label: `${summary.project || 'default'} -> ${summary.repo_alias || 'repo?'} / ${summary.key_alias || 'key?'}`.slice(0, 240)
  };
}

async function buildRouteVisualMap(body = {}) {
  const routes = await readJson(ROUTES_FILE, { profiles: [] });
  const repos = await readJson(REPOS_FILE, { repos: [] });
  const keys = await readJson(KEYS_FILE, { keys: [] });
  const conflicts = await detectRouteConflicts(body && Object.keys(body).length ? body : {});
  const profiles = Array.isArray(routes.profiles) ? routes.profiles : [];
  const nodes = profiles.map((profile, index) => routeVisualNode(profile, index));
  const repoAliases = new Set((repos.repos || []).map((repo) => repo.repo_alias).filter(Boolean));
  const keyAliases = new Set((keys.keys || []).map((key) => key.key_alias).filter(Boolean));
  const edges = nodes.map((node) => ({
    from: node.profile_id,
    to_repo_alias: node.repo_alias,
    to_key_alias: node.key_alias,
    repo_known: repoAliases.has(node.repo_alias),
    key_known: keyAliases.has(node.key_alias),
    route_label: node.route_label
  }));
  const missing = edges.filter((edge) => !edge.repo_known || !edge.key_known);
  return {
    ok: true,
    schema_version: 'openpatch.route_visual_map.v10',
    route_file: ROUTES_FILE,
    total_profiles: nodes.length,
    nodes,
    edges,
    missing_alias_refs: missing,
    conflicts_summary: {
      issue_count: conflicts.issue_count,
      has_blocking_conflict: conflicts.has_blocking_conflict,
      recommended_agent_action: conflicts.recommended_agent_action
    },
    dynamic: conflicts.dynamic || null,
    recommended_agent_action: conflicts.has_blocking_conflict ? 'fix_route_profiles_before_upload' : (missing.length ? 'fix_missing_repo_or_key_aliases' : 'route_visual_map_ok'),
    generated_at: nowIso()
  };
}

async function suggestRouteFixes(body = {}) {
  const conflicts = await detectRouteConflicts(body);
  const visual = await buildRouteVisualMap(body);
  const suggestions = [];
  for (const issue of conflicts.issues || []) {
    if (issue.type === 'duplicate_profile_id') {
      suggestions.push({ severity: 'error', action: 'rename_duplicate_profile_id', reason: 'profile_id must be unique so agents do not confuse routes', profiles: issue.profiles });
    } else if (issue.type === 'multiple_default_profiles') {
      suggestions.push({ severity: 'error', action: 'keep_single_default_profile', reason: 'only one default route should exist across browser contexts', count: issue.count });
    } else if (issue.type === 'missing_repo_alias') {
      suggestions.push({ severity: 'warning', action: 'add_repo_alias_or_fix_profile', reason: 'route cannot upload without a repo_alias', profile: issue.profile });
    } else if (issue.type === 'missing_key_alias') {
      suggestions.push({ severity: 'warning', action: 'add_key_alias_or_fix_profile', reason: 'bridge cannot select a key alias without this field', profile: issue.profile });
    } else if (issue.type === 'ambiguous_route_resolution') {
      suggestions.push({ severity: 'warning', action: 'add_browser_profile_chat_group_or_more_specific_match', reason: 'two or more routes score too closely for this page', candidates: issue.candidates });
    } else {
      suggestions.push({ severity: issue.severity || 'warning', action: `review_${issue.type || 'route_issue'}`, reason: 'manual review recommended', issue });
    }
  }
  for (const edge of visual.missing_alias_refs || []) {
    if (!edge.repo_known) suggestions.push({ severity: 'warning', action: 'create_repo_alias_entry', repo_alias: edge.to_repo_alias, profile_id: edge.from });
    if (!edge.key_known) suggestions.push({ severity: 'warning', action: 'create_key_alias_entry', key_alias: edge.to_key_alias, profile_id: edge.from });
  }
  return {
    ok: true,
    schema_version: 'openpatch.route_fix_suggestions.v10',
    suggestion_count: suggestions.length,
    suggestions,
    recommended_agent_action: suggestions.some((s) => s.severity === 'error') ? 'apply_or_request_route_profile_fix' : (suggestions.length ? 'review_suggestions_then_continue' : 'no_route_fix_needed'),
    generated_at: nowIso()
  };
}

async function stressResolveRoutes(body = {}) {
  const count = Math.max(1, Math.min(1000, Number(body.count || 100)));
  const project = safeId(body.project || body.project_hint || 'stress-route', 'stress-route');
  const samples = Array.isArray(body.samples) && body.samples.length ? body.samples : Array.from({ length: count }, (_, index) => ({
    page_url: `https://chatgpt.com/c/stress-${index}`,
    title: `${project} round ${index}`,
    project_hint: project
  }));
  const results = [];
  let ambiguous = 0;
  let unresolved = 0;
  for (const sample of samples.slice(0, count)) {
    const result = await resolveRoute(sample);
    if (!result.ok) unresolved += 1;
    if (result.route_context?.ambiguity?.status === 'ambiguous') ambiguous += 1;
    results.push({ status: result.status, project: result.route_context?.project || '', route_profile: result.route_context?.route_profile || '', ambiguity: result.route_context?.ambiguity?.status || 'none' });
  }
  return {
    ok: true,
    schema_version: 'openpatch.route_stress.v10',
    count: results.length,
    ambiguous,
    unresolved,
    resolved: results.length - unresolved,
    recommended_agent_action: unresolved || ambiguous ? 'inspect_route_profiles_before_live_upload' : 'route_resolution_stress_ok',
    sample: results.slice(0, 10),
    generated_at: nowIso()
  };
}

async function resolveRoute(body) {
  const routes = await readJson(ROUTES_FILE, { profiles: [] });
  const profiles = Array.isArray(routes.profiles) ? routes.profiles : [];
  const scored = profiles
    .map((profile) => ({ profile, score: profileScore(profile, body) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  const selected = scored[0]?.profile || profiles.find((profile) => profile.default === true) || null;
  const second = scored[1] || null;
  const scoreGap = scored[0] && second ? scored[0].score - second.score : null;
  const ambiguity = Boolean(scored[0] && second && scoreGap <= ROUTE_AMBIGUITY_GAP);
  if (!selected) {
    return {
      ok: false,
      status: "unresolved",
      reason: "no_matching_route_profile",
      input: { project_hint: safeString(body.project_hint || body.project || "", 100), page_url_host: hostOnly(body.page_url || body.url || "") }
    };
  }
  return {
    ok: true,
    status: "resolved",
    route_context: {
      schema_version: "openpatch.route_context.v10",
      route_profile: safeString(selected.profile_id || selected.route_profile || "", 120),
      project: safeId(selected.project || body.project_hint || "default", "default"),
      repo_alias: safeString(selected.repo_alias || body.repo_alias || "", 120),
      key_alias: safeString(selected.key_alias || body.key_alias || "", 120),
      archive_root: safeString(selected.archive_root || "rounds", 120),
      index_root: safeString(selected.index_root || "index", 120),
      mode: safeString(selected.mode || "roundpack_archive", 60),
      confidence: scored[0]?.score || 1,
      ambiguity: ambiguity ? { status: 'ambiguous', score_gap: scoreGap, candidates: scored.slice(0, 5).map((item, index) => ({ rank: index + 1, score: item.score, profile: summarizeProfile(item.profile, index) })) } : { status: 'clear', score_gap: scoreGap },
      resolved_at: nowIso()
    },
    candidates: scored.slice(0, 5).map((item, index) => ({ rank: index + 1, score: item.score, profile: summarizeProfile(item.profile, index) })),
    recommended_agent_action: ambiguity ? 'confirm_route_or_set_route_context_before_upload' : 'continue_with_resolved_route'
  };
}

function sanitizeFileName(name, fallback = "webai-roundpack.zip") {
  const value = String(name || fallback)
    .replace(/[\\/]+/g, "-")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "");
  return value || fallback;
}

function formatDatePath(date = new Date()) {
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

function buildRoundArchivePath({ archiveRoot, project, roundId, fileName }) {
  return `${safeId(archiveRoot || "rounds", "rounds")}/${safeId(project, "default")}/${formatDatePath()}/${safeId(roundId, "round")}/${sanitizeFileName(fileName)}`;
}
function siblingPath(filePath, fileName) { const parts = String(filePath).split("/"); parts[parts.length - 1] = fileName; return parts.join("/"); }
function latestPath({ indexRoot = "index", project = "default" }) { return `${safeId(indexRoot, "index")}/latest/${safeId(project, "default")}.json`; }

async function getKeyAlias(alias) {
  const keys = await readJson(KEYS_FILE, { keys: [] });
  const entry = (Array.isArray(keys.keys) ? keys.keys : []).find((item) => safeId(item.key_alias || item.alias) === safeId(alias));
  if (!entry) return null;
  const token = entry.token || (entry.token_env ? process.env[String(entry.token_env)] : "");
  return {
    key_alias: safeString(entry.key_alias || entry.alias || alias, 120),
    provider: safeString(entry.provider || "github", 40),
    token,
    token_env: entry.token_env || "",
    has_token: Boolean(token)
  };
}

async function getRepoAlias(alias) {
  const repos = await readJson(REPOS_FILE, { repos: [] });
  return (Array.isArray(repos.repos) ? repos.repos : []).find((item) => safeId(item.repo_alias || item.alias) === safeId(alias)) || null;
}

async function sanitizedConfigStatus() {
  const routes = await readJson(ROUTES_FILE, { profiles: [] });
  const repos = await readJson(REPOS_FILE, { repos: [] });
  const keys = await readJson(KEYS_FILE, { keys: [] });
  return {
    ok: true,
    schema_version: "openpatch.bridge_config_status.v7",
    root: ROOT,
    files: { routes_file: ROUTES_FILE, repos_file: REPOS_FILE, keys_file: KEYS_FILE },
    routes: (routes.profiles || []).map((item) => ({ profile_id: item.profile_id || item.route_profile || "", project: item.project || "", repo_alias: item.repo_alias || "", key_alias: item.key_alias || "", default: Boolean(item.default) })),
    repos: (repos.repos || []).map((item) => ({ repo_alias: item.repo_alias || item.alias || "", provider: item.provider || "github", owner: item.owner || "", repo: item.repo || "", branch: item.branch || "", archive_root: item.archive_root || "rounds", index_root: item.index_root || "index", dry_run: Boolean(item.dry_run) })),
    keys: (keys.keys || []).map((item) => {
      const token = item.token || (item.token_env ? process.env[String(item.token_env)] : "");
      return { key_alias: item.key_alias || item.alias || "", provider: item.provider || "github", token_env: item.token_env || "", has_token: Boolean(token) };
    }),
    updated_at: nowIso()
  };
}

async function resolveArchiveTarget(body) {
  const inputRoute = body.route_context || body.routeContext || {};
  let route = inputRoute.project ? { ok: true, route_context: inputRoute } : await resolveRoute(body);
  if (!route.ok) route = { ok: true, route_context: { project: body.project || "default", repo_alias: body.repo_alias || "", key_alias: body.key_alias || "", archive_root: body.archive_root || "rounds", index_root: body.index_root || "index", route_profile: body.route_profile || "manual" } };
  const routeContext = route.route_context || {};
  if (routeContext?.ambiguity?.status === 'ambiguous' || route?.ambiguous === true) {
    throw new Error('route_context_ambiguous_before_archive');
  }
  const repoAliasName = body.repo_alias || routeContext.repo_alias;
  const keyAliasName = body.key_alias || routeContext.key_alias;
  const repo = await getRepoAlias(repoAliasName);
  const key = await getKeyAlias(keyAliasName);
  return { route_context: routeContext, repo_alias: repoAliasName, key_alias: keyAliasName, repo, key };
}

function buildContentsApiUrl({ owner, repo, filePath }) {
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${String(filePath).split("/").map(encodeURIComponent).join("/")}`;
}

async function githubError(response) {
  let detail = "";
  try { const json = await response.json(); detail = json.message || JSON.stringify(json); } catch { detail = await response.text(); }
  return `GitHub API ${response.status}: ${detail}`;
}

async function githubGetFile({ token, owner, repo, branch, filePath }) {
  const url = new URL(buildContentsApiUrl({ owner, repo, filePath }));
  if (branch) url.searchParams.set("ref", branch);
  const response = await githubFetchWithBackoff(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await githubError(response));
  return response.json();
}

async function githubUpsertFile({ token, owner, repo, branch, filePath, message, contentBase64 }) {
  const existing = await githubGetFile({ token, owner, repo, branch, filePath });
  const response = await githubFetchWithBackoff(buildContentsApiUrl({ owner, repo, filePath }), {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "X-GitHub-Api-Version": "2022-11-28" },
    body: JSON.stringify({ message, content: contentBase64, branch, ...(existing?.sha ? { sha: existing.sha } : {}) })
  });
  if (!response.ok) throw new Error(await githubError(response));
  return response.json();
}

async function updateLocalLatestAndIndexes({ project, roundId, receipt, fileSha256, receiptPath }) {
  return withLock(`project:${project}`, async () => {
    const now = nowIso();
    const latestFile = path.join(LATEST_DIR, `${project}.json`);
    const previousLatest = await readJson(latestFile, { recent_rounds: [] });
    const item = { project, round_id: roundId, status: receipt.status || "received", file_sha256: fileSha256, receipt_path: receiptPath, received_at: receipt.created_at || now };
    const history = Array.isArray(previousLatest.recent_rounds) ? previousLatest.recent_rounds : [];
    const latest = {
      schema_version: "openpatch.bridge_latest.v7",
      project,
      latest_round: roundId,
      status: item.status,
      latest: item,
      recent_rounds: [item, ...history.filter((existing) => existing.round_id !== roundId)].slice(0, 50),
      codex_next_query: `/latest?project=${encodeURIComponent(project)}`,
      updated_at: now
    };
    await writeJsonAtomic(latestFile, latest);

    const status = await readJson(STATUS_FILE, { schema_version: "openpatch.bridge_status.v10", receipts: [] });
    const receipts = Array.isArray(status.receipts) ? status.receipts : [];
    status.receipts = [item, ...receipts.filter((existing) => existing.round_id !== roundId || existing.project !== project)].slice(0, 500);
    status.latest_by_project = { ...(status.latest_by_project || {}), [project]: roundId };
    status.updated_at = now;
    await writeJsonAtomic(STATUS_FILE, status);

    let duplicate = null;
    if (fileSha256) {
      const shaIndex = await readJson(SHA_INDEX_FILE, { schema_version: "openpatch.sha_index.v1", entries: [] });
      const entries = Array.isArray(shaIndex.entries) ? shaIndex.entries : [];
      const existing = entries.find((entry) => entry.project === project && entry.file_sha256 === fileSha256);
      if (existing && existing.first_round_id !== roundId) duplicate = { project, file_sha256: fileSha256, first_round_id: existing.first_round_id, latest_round_id: existing.latest_round_id, count: existing.count };
      const next = existing ? { ...existing, latest_round_id: roundId, count: Number(existing.count || 1) + 1, updated_at: now } : { project, file_sha256: fileSha256, first_round_id: roundId, latest_round_id: roundId, count: 1, created_at: now, updated_at: now };
      shaIndex.entries = [next, ...entries.filter((entry) => !(entry.project === project && entry.file_sha256 === fileSha256))].slice(0, 2000);
      shaIndex.updated_at = now;
      await writeJsonAtomic(SHA_INDEX_FILE, shaIndex);
    }
    return { latest, duplicate };
  });
}

function extractReceiptPayload(body) {
  const payload = body?.receipt || body?.payload?.receipt || body?.result?.receipt || body;
  const project = safeId(payload.project || body.project || body.payload?.project || "default", "default");
  const roundId = safeId(payload.round_id || payload.roundId || body.round_id || body.roundId || `${Date.now()}`, "round");
  const fileSha256 = safeString(payload.file_sha256 || payload.fileSha256 || body.file_sha256 || body.fileSha256 || body.result?.fileSha256 || "", 128);
  return { payload, project, roundId, fileSha256 };
}

async function receiveReceipt(body) {
  const { payload, project, roundId, fileSha256 } = extractReceiptPayload(body);
  const receipt = { schema_version: "openpatch.bridge_receipt.v7", project, round_id: roundId, file_sha256: fileSha256, source: safeString(body.source || "openpatch-extension-or-agent", 120), payload_sha256: sha256Text(JSON.stringify(body)), received_at: nowIso(), payload };
  const receiptPath = path.join(RECEIPTS_DIR, project, `${roundId}.json`);
  await writeJsonAtomic(receiptPath, receipt);
  const { latest, duplicate } = await updateLocalLatestAndIndexes({ project, roundId, receipt: { ...payload, status: payload.status || "received", created_at: receipt.received_at }, fileSha256, receiptPath });
  await appendEvent("receipt_received", { project, round_id: roundId, file_sha256: fileSha256, duplicate: Boolean(duplicate) });
  return { ok: true, status: duplicate ? "received_duplicate_sha" : "received", receipt: { project, round_id: roundId, receipt_path: receiptPath, file_sha256: fileSha256, received_at: receipt.received_at }, latest, duplicate };
}

async function archiveBase64(body) {
  const { route_context, repo_alias, key_alias, repo, key } = await resolveArchiveTarget(body);
  const project = safeId(body.project || route_context.project || "default", "default");
  const roundId = safeId(body.round_id || body.roundId || route_context.round_id || `${project}-${Date.now()}`, "round");
  const fileName = sanitizeFileName(body.file_name || body.fileName || "webai-roundpack.zip");
  const contentBase64 = String(body.content_base64 || body.content || "").replace(/\s/g, "");
  if (!contentBase64) throw new Error("content_base64_missing");
  const archiveSizeBytes = base64SizeBytes(contentBase64);
  if (archiveSizeBytes > MAX_ARCHIVE_BYTES) throw new Error(`archive_too_large:${archiveSizeBytes}:max:${MAX_ARCHIVE_BYTES}`);
  const fileSha256 = sha256Base64(contentBase64);
  const archiveRoot = body.archive_root || route_context.archive_root || repo?.archive_root || "rounds";
  const indexRoot = body.index_root || route_context.index_root || repo?.index_root || "index";
  const archivePath = buildRoundArchivePath({ archiveRoot, project, roundId, fileName });
  const manifestPath = siblingPath(archivePath, "archive_manifest.json");
  const receiptGithubPath = siblingPath(archivePath, "upload_receipt.json");
  const latestGithubPath = latestPath({ indexRoot, project });
  const branch = body.branch || repo?.branch || "webai-archive";
  const owner = repo?.owner || body.owner || "";
  const repoName = repo?.repo || body.repo || "";
  const dryRun = Boolean(body.dry_run || repo?.dry_run);
  const status = dryRun ? "dry_run_planned" : "uploaded";
  const receipt = {
    schema_version: "openpatch.upload_receipt.v7",
    status,
    archive_only: true,
    allow_execution: false,
    project,
    round_id: roundId,
    file_name: fileName,
    file_sha256: fileSha256,
    size_bytes: archiveSizeBytes,
    route_context: { ...route_context, repo_alias, key_alias },
    github: { owner, repo: repoName, branch, archive_path: archivePath, manifest_path: manifestPath, receipt_path: receiptGithubPath, latest_path: latestGithubPath, dry_run: dryRun },
    created_at: nowIso(),
    next_actions: ["read_latest", "fetch_roundpack", "read_receipt", "continue_agent_workflow"]
  };
  const manifest = {
    schema_version: "openpatch.archive_manifest.v7",
    archive_only: true,
    allow_execution: false,
    project,
    round_id: roundId,
    title: safeString(body.title || "", 300),
    files: [{ name: fileName, sha256: fileSha256, size_bytes: archiveSizeBytes, role: "roundpack_or_artifact", path: archivePath }],
    receipt_path: receiptGithubPath,
    latest_path: latestGithubPath,
    route_context: receipt.route_context,
    created_at: receipt.created_at
  };
  const previousLatest = null;
  const latest = {
    schema_version: "openpatch.latest.v7",
    project,
    latest_round: roundId,
    status,
    archive_only: true,
    allow_execution: false,
    latest: { round_id: roundId, project, status, file_name: fileName, file_sha256: fileSha256, size_bytes: archiveSizeBytes, archive_path: archivePath, receipt_path: receiptGithubPath, created_at: receipt.created_at },
    recent_rounds: previousLatest?.recent_rounds || [],
    codex_should_read: ["upload_receipt.json", "archive_manifest.json", "NEXT_FOR_CODEX.md", "ROUND_SUMMARY.md"],
    next_actor: "codex_or_reviewer",
    updated_at: nowIso()
  };

  let commitSha = "";
  if (!dryRun) {
    if (!repo) throw new Error(`repo_alias_not_found:${repo_alias || ""}`);
    if (!key?.token) throw new Error(`key_alias_token_missing:${key_alias || ""}`);
    await githubUpsertFile({ token: key.token, owner, repo: repoName, branch, filePath: archivePath, message: `chore(openpatch): archive ${fileName}`, contentBase64 });
    await githubUpsertFile({ token: key.token, owner, repo: repoName, branch, filePath: manifestPath, message: `chore(openpatch): write archive manifest for ${roundId}`, contentBase64: encodeBase64Utf8(JSON.stringify(manifest, null, 2)) });
    await githubUpsertFile({ token: key.token, owner, repo: repoName, branch, filePath: receiptGithubPath, message: `chore(openpatch): write upload receipt for ${roundId}`, contentBase64: encodeBase64Utf8(JSON.stringify(receipt, null, 2)) });
    let prior = null;
    try { prior = decodeBase64Json((await githubGetFile({ token: key.token, owner, repo: repoName, branch, filePath: latestGithubPath }))?.content || ""); } catch { prior = null; }
    if (Array.isArray(prior?.recent_rounds)) latest.recent_rounds = [latest.latest, ...prior.recent_rounds.filter((item) => item.round_id !== roundId)].slice(0, 50);
    const latestResult = await githubUpsertFile({ token: key.token, owner, repo: repoName, branch, filePath: latestGithubPath, message: `chore(openpatch): update latest index for ${project}`, contentBase64: encodeBase64Utf8(JSON.stringify(latest, null, 2)) });
    commitSha = latestResult?.commit?.sha || "";
  }

  const localReceiptPath = path.join(RECEIPTS_DIR, project, `${roundId}.json`);
  await writeJsonAtomic(localReceiptPath, { schema_version: "openpatch.bridge_archive_receipt.v7", source: "local-bridge", local_receipt_path: localReceiptPath, receipt, manifest, latest, commit_sha: commitSha });
  const local = await updateLocalLatestAndIndexes({ project, roundId, receipt, fileSha256, receiptPath: localReceiptPath });
  await appendEvent("archive_base64", { project, round_id: roundId, status, file_sha256: fileSha256, repo_alias, key_alias, dry_run: dryRun });
  return { ok: true, status, mode: "bridge_archive_base64", project, round_id: roundId, file_sha256: fileSha256, repo_alias, key_alias, paths: { archive_path: archivePath, manifest_path: manifestPath, receipt_path: receiptGithubPath, latest_path: latestGithubPath }, github: receipt.github, commit_sha: commitSha, receipt, latest, duplicate: local.duplicate };
}

async function enqueueTask(body) {
  return withLock("queue", async () => {
    const now = nowIso();
    const queue = await readJson(QUEUE_FILE, { schema_version: "openpatch.bridge_queue.v2", items: [] });
    const items = Array.isArray(queue.items) ? queue.items : [];
    const project = safeId(body.project || "default", "default");
    const roundId = safeId(body.round_id || body.roundId || `${Date.now()}`, "round");
    const fileSha256 = safeString(body.file_sha256 || body.fileSha256 || "", 128);
    const idempotencyKey = safeId(body.idempotency_key || body.idempotencyKey || `${project}-${roundId}-${fileSha256 || "no-sha"}`, "task");
    const existing = items.find((item) => item.idempotency_key === idempotencyKey);
    if (existing) return { ok: true, status: "duplicate", task: existing };
    const task = { schema_version: "openpatch.bridge_queue_item.v1", idempotency_key: idempotencyKey, project, round_id: roundId, file_sha256: fileSha256, status: "queued", action: safeString(body.action || "archive_roundpack", 80), route_context: body.route_context || {}, created_at: now, updated_at: now };
    queue.items = [task, ...items].slice(0, 1000);
    queue.updated_at = now;
    await writeJsonAtomic(QUEUE_FILE, queue);
    await appendEvent("queue_enqueued", { project, round_id: roundId, idempotency_key: idempotencyKey });
    return { ok: true, status: "queued", task };
  });
}

async function updateQueueTask(body, status) {
  return withLock("queue", async () => {
    const queue = await readJson(QUEUE_FILE, { schema_version: "openpatch.bridge_queue.v2", items: [] });
    const items = Array.isArray(queue.items) ? queue.items : [];
    const idempotencyKey = safeId(body.idempotency_key || body.idempotencyKey || "", "");
    const project = safeId(body.project || "default", "default");
    const roundId = safeId(body.round_id || body.roundId || "", "");
    const now = nowIso();
    let found = false;
    queue.items = items.map((item) => {
      const match = idempotencyKey ? item.idempotency_key === idempotencyKey : (item.project === project && item.round_id === roundId);
      if (!match) return item;
      found = true;
      return { ...item, status, result: body.result || item.result || null, error: body.error || "", updated_at: now };
    });
    queue.updated_at = now;
    await writeJsonAtomic(QUEUE_FILE, queue);
    return { ok: found, status: found ? "updated" : "not_found" };
  });
}

async function getReceiptQuery(params) {
  const project = safeId(params.get("project") || "default", "default");
  const roundId = safeId(params.get("round") || params.get("round_id") || "", "");
  if (!roundId) return { ok: false, status: "round_missing", project };
  const receiptPath = path.join(RECEIPTS_DIR, project, `${roundId}.json`);
  const receipt = await readJson(receiptPath, null);
  return receipt ? { ok: true, status: "found", project, round_id: roundId, receipt_path: receiptPath, receipt } : { ok: false, status: "missing", project, round_id: roundId, receipt_path: receiptPath };
}

async function claimQueueTask(body = {}) {
  return withLock("queue", async () => {
    const queue = await readJson(QUEUE_FILE, { schema_version: "openpatch.bridge_queue.v2", items: [] });
    const items = Array.isArray(queue.items) ? queue.items : [];
    const project = body.project ? safeId(body.project, "default") : "";
    const now = nowIso();
    const target = items.find((item) => (project ? item.project === project : true) && (["queued", "retry_requested"].includes(item.status) || isLeaseExpired(item)));
    if (!target) return { ok: true, status: "empty", task: null };
    const leaseUntil = new Date(Date.now() + Math.max(60_000, Number(body.lease_ms || body.leaseMs || DEFAULT_LEASE_MS))).toISOString();
    queue.items = items.map((item) => item.idempotency_key === target.idempotency_key ? { ...item, status: "claimed", claimed_by: safeString(body.claimed_by || body.agent || "agent", 120), lease_until: leaseUntil, updated_at: now } : item);
    queue.updated_at = now;
    await writeJsonAtomic(QUEUE_FILE, queue);
    await appendEvent("queue_claimed", { project: target.project, round_id: target.round_id, idempotency_key: target.idempotency_key });
    return { ok: true, status: "claimed", lease_until: leaseUntil, task: queue.items.find((item) => item.idempotency_key === target.idempotency_key) };
  });
}

async function retryQueueTask(body = {}) {
  return withLock("queue", async () => {
    const queue = await readJson(QUEUE_FILE, { schema_version: "openpatch.bridge_queue.v2", items: [] });
    const items = Array.isArray(queue.items) ? queue.items : [];
    const idempotencyKey = safeId(body.idempotency_key || body.idempotencyKey || "", "");
    const project = safeId(body.project || "default", "default");
    const roundId = safeId(body.round_id || body.roundId || "", "");
    const now = nowIso();
    let changed = false;
    queue.items = items.map((item) => {
      const match = idempotencyKey ? item.idempotency_key === idempotencyKey : (item.project === project && item.round_id === roundId);
      if (!match) return item;
      changed = true;
      return { ...item, status: "retry_requested", retry_count: Number(item.retry_count || 0) + 1, retry_reason: safeString(body.reason || "manual_retry", 300), updated_at: now };
    });
    queue.updated_at = now;
    await writeJsonAtomic(QUEUE_FILE, queue);
    if (changed) await appendEvent("queue_retry_requested", { project, round_id: roundId, idempotency_key: idempotencyKey });
    return { ok: changed, status: changed ? "retry_requested" : "not_found" };
  });
}


function isLeaseExpired(item, nowMs = Date.now()) {
  const leaseUntil = Date.parse(item?.lease_until || "");
  return Boolean(item?.status === "claimed" && leaseUntil && leaseUntil < nowMs);
}


async function reclaimExpiredQueueTasks(body = {}) {
  return withLock('queue', async () => {
    const queue = await readJson(QUEUE_FILE, { schema_version: 'openpatch.bridge_queue.v2', items: [] });
    const items = Array.isArray(queue.items) ? queue.items : [];
    const project = body.project ? safeId(body.project, 'default') : '';
    const now = nowIso();
    const reclaimed = [];
    queue.items = items.map((item) => {
      if ((project ? item.project === project : true) && isLeaseExpired(item)) {
        const next = { ...item, status: 'retry_requested', reclaimed_reason: safeString(body.reason || 'lease_expired_reclaim', 200), claimed_by: '', lease_until: '', updated_at: now };
        reclaimed.push(next);
        return next;
      }
      return item;
    });
    queue.updated_at = now;
    await writeJsonAtomic(QUEUE_FILE, queue);
    if (reclaimed.length) await appendEvent('queue_expired_reclaimed', { project: project || 'all', count: reclaimed.length });
    return { ok: true, schema_version: 'openpatch.queue_reclaim_expired.v9', project: project || 'all', count: reclaimed.length, tasks: reclaimed.slice(0, 50), reclaimed_at: now };
  });
}

async function queueStats(projectInput = "") {
  const queue = await readJson(QUEUE_FILE, { schema_version: "openpatch.bridge_queue.v2", items: [] });
  const project = projectInput ? safeId(projectInput, "default") : "";
  const items = Array.isArray(queue.items) ? queue.items.filter((item) => project ? item.project === project : true) : [];
  const counts = {};
  for (const item of items) {
    const status = isLeaseExpired(item) ? "lease_expired" : (item.status || "unknown");
    counts[status] = Number(counts[status] || 0) + 1;
  }
  return { ok: true, schema_version: "openpatch.queue_stats.v1", project: project || "all", total: items.length, counts, updated_at: queue.updated_at || nowIso() };
}

async function recentReceipts(params) {
  const project = params.get("project") ? safeId(params.get("project"), "default") : "";
  const limit = Math.max(1, Math.min(200, Number(params.get("limit") || 20)));
  const status = await readJson(STATUS_FILE, { schema_version: "openpatch.bridge_status.v10", receipts: [] });
  const receipts = (Array.isArray(status.receipts) ? status.receipts : []).filter((item) => project ? item.project === project : true).slice(0, limit);
  return { ok: true, schema_version: "openpatch.recent_receipts.v1", project: project || "all", count: receipts.length, receipts, updated_at: status.updated_at || nowIso() };
}

async function compactSummary(projectInput = "default") {
  const project = safeId(projectInput || "default", "default");
  const latest = await readJson(path.join(LATEST_DIR, `${project}.json`), { schema_version: "openpatch.bridge_latest.v7", project, status: "missing", latest_round: "" });
  const stats = await queueStats(project);
  const receipt = latest.latest_round ? await readJson(path.join(RECEIPTS_DIR, project, `${latest.latest_round}.json`), null) : null;
  return {
    ok: true,
    schema_version: "openpatch.compact_summary.v1",
    project,
    latest_round: latest.latest_round || "",
    status: latest.status || "missing",
    archive_only: latest.archive_only !== false,
    allow_execution: latest.allow_execution === true,
    file_sha256: latest.latest?.file_sha256 || receipt?.receipt?.file_sha256 || receipt?.payload?.file_sha256 || "",
    queue_counts: stats.counts,
    recommended_agent_action: latest.latest_round ? "read_latest_receipt_or_fetch_roundpack" : "request_or_archive_roundpack",
    codex_next: latest.latest_round
      ? `node local-bridge/openpatch-ledger-cli.mjs receipt --project ${project} --round ${latest.latest_round}`
      : `node local-bridge/openpatch-ledger-cli.mjs auto-continue-plan --project ${project} --message-count 0 --force`,
    updated_at: nowIso()
  };
}

async function claimQueueBatch(body = {}) {
  return withLock("queue", async () => {
    const queue = await readJson(QUEUE_FILE, { schema_version: "openpatch.bridge_queue.v2", items: [] });
    const items = Array.isArray(queue.items) ? queue.items : [];
    const project = body.project ? safeId(body.project, "default") : "";
    const max = Math.max(1, Math.min(50, Number(body.max || body.limit || 5)));
    const now = nowIso();
    const leaseUntil = new Date(Date.now() + Math.max(60_000, Number(body.lease_ms || body.leaseMs || DEFAULT_LEASE_MS))).toISOString();
    const claimed = [];
    queue.items = items.map((item) => {
      if (claimed.length >= max) return item;
      const status = isLeaseExpired(item) ? "retry_requested" : item.status;
      if ((project ? item.project === project : true) && ["queued", "retry_requested"].includes(status)) {
        const next = { ...item, status: "claimed", claimed_by: safeString(body.claimed_by || body.agent || "agent", 120), lease_until: leaseUntil, updated_at: now };
        claimed.push(next);
        return next;
      }
      return item;
    });
    queue.updated_at = now;
    await writeJsonAtomic(QUEUE_FILE, queue);
    if (claimed.length) await appendEvent("queue_claimed_batch", { project: project || "all", count: claimed.length, claimed_by: safeString(body.claimed_by || body.agent || "agent", 120) });
    return { ok: true, status: claimed.length ? "claimed" : "empty", count: claimed.length, lease_until: leaseUntil, tasks: claimed };
  });
}

async function releaseQueueTask(body = {}) {
  return withLock("queue", async () => {
    const queue = await readJson(QUEUE_FILE, { schema_version: "openpatch.bridge_queue.v2", items: [] });
    const items = Array.isArray(queue.items) ? queue.items : [];
    const idempotencyKey = safeId(body.idempotency_key || body.idempotencyKey || "", "");
    const project = safeId(body.project || "default", "default");
    const roundId = safeId(body.round_id || body.roundId || "", "");
    const now = nowIso();
    let found = false;
    queue.items = items.map((item) => {
      const match = idempotencyKey ? item.idempotency_key === idempotencyKey : (item.project === project && item.round_id === roundId);
      if (!match) return item;
      found = true;
      return { ...item, status: "queued", claimed_by: "", lease_until: "", release_reason: safeString(body.reason || "manual_release", 200), updated_at: now };
    });
    queue.updated_at = now;
    await writeJsonAtomic(QUEUE_FILE, queue);
    if (found) await appendEvent("queue_released", { project, round_id: roundId, idempotency_key: idempotencyKey });
    return { ok: found, status: found ? "released" : "not_found" };
  });
}

async function agentSummary(projectInput = "default") {
  const project = safeId(projectInput || "default", "default");
  const latest = await readJson(path.join(LATEST_DIR, `${project}.json`), { schema_version: "openpatch.bridge_latest.v7", project, status: "missing", latest_round: "" });
  const queue = await readJson(QUEUE_FILE, { schema_version: "openpatch.bridge_queue.v2", items: [] });
  const status = await readJson(STATUS_FILE, { schema_version: "openpatch.bridge_status.v10", receipts: [] });
  const shaIndex = await readJson(SHA_INDEX_FILE, { schema_version: "openpatch.sha_index.v1", entries: [] });
  const projectQueue = (queue.items || []).filter((item) => item.project === project).slice(0, 20);
  const projectSha = (shaIndex.entries || []).filter((item) => item.project === project).slice(0, 10);
  return {
    ok: true,
    schema_version: "openpatch.agent_summary.v1",
    project,
    latest_round: latest.latest_round || "",
    status: latest.status || "missing",
    latest,
    queue: { count: projectQueue.length, items: projectQueue },
    duplicates: projectSha.filter((entry) => Number(entry.count || 0) > 1),
    total_receipts: Array.isArray(status.receipts) ? status.receipts.filter((item) => item.project === project).length : 0,
    recommended_agent_action: latest.latest_round ? "read_latest_receipt_then_continue" : "request_roundpack_or_resolve_route",
    codex_commands: [
      `node local-bridge/openpatch-ledger-cli.mjs latest --project ${project}`,
      `node local-bridge/openpatch-ledger-cli.mjs receipt --project ${project} --round ${latest.latest_round || "<round_id>"}`
    ],
    updated_at: nowIso()
  };
}

async function autoContinuePlan(body = {}) {
  const project = safeId(body.project || body.project_hint || "default", "default");
  const messageCount = Number(body.message_count || body.messageCount || 0);
  const interval = Math.max(1, Number(body.roundpack_interval || body.roundpackInterval || 5));
  const force = Boolean(body.force_roundpack || body.forceRoundpack);
  const shouldRequest = force || (messageCount > 0 && messageCount % interval === 0);
  const plan = {
    ok: true,
    schema_version: "openpatch.auto_continue_plan.v1",
    project,
    should_request_roundpack: shouldRequest,
    should_pause_until_archive_receipt: shouldRequest,
    reason: force ? "force_roundpack" : (shouldRequest ? "interval_reached" : "continue_allowed"),
    required_marker: "[ROUND_PACK_READY]",
    preferred_file_name: `webai-roundpack-${project}.zip`,
    prompt_hint: "use_openpatch_roundpack_prompt",
    next_agent_action: shouldRequest ? "send_roundpack_prompt_wait_for_attachment_then_trigger_archive" : "continue_iteration",
    created_at: nowIso()
  };
  await appendEvent("auto_continue_plan", { project, should_request_roundpack: shouldRequest, reason: plan.reason });
  return plan;
}



async function readinessReport(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const target = safeId(body.target || 'bridge-only', 'bridge-only');
  const lint = await configLint();
  const latest = await readJson(path.join(LATEST_DIR, `${project}.json`), { schema_version: 'openpatch.bridge_latest.v7', project, status: 'missing', latest_round: '' });
  const queue = await queueStats(project);
  const instances = await listInstances();
  const routeConflicts = await detectRouteConflicts({ project_hint: project });
  const rate = githubRateStatus();
  const blocking = [];
  const warnings = [];
  if (!lint.ok) blocking.push({ code: 'config_lint_errors', count: lint.errors.length });
  if (routeConflicts.has_blocking_conflict) blocking.push({ code: 'route_conflict_blocking', count: (routeConflicts.conflicts || []).length });
  if (target.includes('github') && lint.warnings.some((item) => item.code === 'key_material_unresolved')) warnings.push({ code: 'github_key_material_warning', detail: 'key material is unresolved or intentionally dry-run' });
  if (!instances.instances.length) warnings.push({ code: 'no_browser_instances_registered', detail: 'bridge-only smoke can continue; chrome smoke should register an instance' });
  if (queue.counts?.claimed > 0) warnings.push({ code: 'claimed_queue_items_present', count: queue.counts.claimed });
  const goNoGo = blocking.length ? 'no_go' : (warnings.length ? 'go_with_warnings' : 'go');
  const nextAction = blocking.length
    ? 'fix_blockers_before_smoke'
    : (target === 'bridge-only' ? 'run_bridge_only_smoke_and_collect_evidence' : 'run_target_smoke_with_receipt_evidence');
  return {
    ok: blocking.length === 0,
    schema_version: 'openpatch.readiness_report.v12',
    project,
    target,
    go_no_go: goNoGo,
    blocking,
    warnings,
    compact: {
      latest_round: latest.latest_round || '',
      latest_status: latest.status || 'missing',
      queue_counts: queue.counts || {},
      instance_count: instances.instances.length,
      github_rate_last_status: rate.last_status || 0
    },
    recommended_agent_action: nextAction,
    codex_commands: [
      `node local-bridge/openpatch-ledger-cli.mjs readiness --project ${project} --target ${target}`,
      `node local-bridge/openpatch-ledger-cli.mjs smoke-plan --project ${project} --target ${target === 'bridge-only' ? 'bridge' : target}`,
      `node local-bridge/openpatch-ledger-cli.mjs evidence-template --project ${project} --target ${target}`
    ],
    checked_at: nowIso()
  };
}

async function codexHandoff(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const target = safeId(body.target || 'bridge-only', 'bridge-only');
  const readiness = await readinessReport({ project, target });
  const plan = await smokePlan({ project, target: target === 'bridge-only' ? 'bridge' : target });
  return {
    ok: true,
    schema_version: 'openpatch.codex_handoff.v12',
    project,
    target,
    go_no_go: readiness.go_no_go,
    one_line_task: readiness.ok
      ? `Run ${target} smoke for ${project}, collect JSON evidence, and stop at the next real blocker.`
      : `Do not run ${target} smoke yet; fix readiness blockers first.`,
    default_commands: plan.steps.map((step) => step.command).slice(0, 6),
    evidence_required: [
      'health.json',
      'config_lint.json',
      'readiness.json',
      'smoke_plan.json',
      'archive_or_receipt.json when applicable',
      'go_no_go_summary.json'
    ],
    stop_at: [
      'config-lint errors',
      'route conflict marked blocking',
      'unexpected secret/token printed',
      'real GitHub upload requested without the matching one-run approval',
      'browser profile is not the intended isolated profile'
    ],
    readiness,
    created_at: nowIso()
  };
}

async function evidenceTemplate(body = {}) {
  const project = safeId(body.project || 'default', 'default');
  const target = safeId(body.target || 'bridge-only', 'bridge-only');
  return {
    ok: true,
    schema_version: 'openpatch.evidence_template.v12',
    project,
    target,
    status: 'pending',
    required_files: [
      'health.json',
      'config_lint.json',
      'readiness.json',
      'smoke_plan.json',
      'latest_or_receipt.json',
      'SELF_TEST_NOTES.md'
    ],
    evidence_json_template: {
      schema_version: 'openpatch.smoke_evidence.v12',
      project,
      target,
      actor: 'codex_or_local_agent',
      started_at: '',
      finished_at: '',
      commands_run: [],
      files_created: [],
      pass: false,
      blockers: [],
      warnings: [],
      next_recommended_action: ''
    },
    created_at: nowIso()
  };
}

async function pruneStaleInstances(body = {}) {
  return withLock('instances', async () => {
    const data = await readJson(INSTANCES_FILE, { schema_version: 'openpatch.browser_instances.v1', instances: [], updated_at: nowIso() });
    const now = Date.now();
    const before = Array.isArray(data.instances) ? data.instances.length : 0;
    const kept = (Array.isArray(data.instances) ? data.instances : []).filter((item) => {
      const ttlMs = Math.max(60_000, Number(item.ttl_ms || 10 * 60 * 1000));
      const lastSeen = Date.parse(item.last_seen_at || item.first_seen_at || '') || 0;
      return lastSeen && (now - lastSeen) <= ttlMs;
    });
    data.instances = kept;
    data.updated_at = nowIso();
    await writeJsonAtomic(INSTANCES_FILE, data);
    const pruned = before - kept.length;
    if (pruned) await appendEvent('browser_instances_pruned', { pruned, remaining: kept.length });
    return { ok: true, schema_version: 'openpatch.instances_prune.v12', before, after: kept.length, pruned, updated_at: data.updated_at };
  });
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

async function configSnapshot() {
  const routesRaw = await readJson(ROUTES_FILE, { profiles: [] });
  const reposRaw = await readJson(REPOS_FILE, { repos: [] });
  const keysRaw = await readJson(KEYS_FILE, { keys: [] });
  const profiles = asArray(routesRaw.profiles);
  const repos = asArray(reposRaw.repos);
  const keys = asArray(keysRaw.keys);
  const repoMap = new Map(repos.map((repo) => [safeId(repo.repo_alias || repo.alias || '', ''), repo]).filter(([alias]) => alias));
  const keyMap = new Map(keys.map((key) => [safeId(key.key_alias || key.alias || '', ''), key]).filter(([alias]) => alias));
  const bindings = profiles.map((profile, index) => {
    const project = safeId(profile.project || '', 'default');
    const repoAlias = safeId(profile.repo_alias || profile.repoAlias || '', '');
    const keyAlias = safeId(profile.key_alias || profile.keyAlias || '', '');
    const repo = repoMap.get(repoAlias) || null;
    const key = keyMap.get(keyAlias) || null;
    return {
      profile_id: safeId(profile.profile_id || profile.route_profile || profile.routeProfile || `profile-${index}`, `profile-${index}`),
      project,
      repo_alias: repoAlias,
      key_alias: keyAlias,
      repo_known: Boolean(repo),
      key_known: Boolean(key),
      repo_dry_run: Boolean(repo?.dry_run),
      branch: safeString(repo?.branch || '', 120),
      archive_root: safeString(profile.archive_root || repo?.archive_root || 'rounds', 120),
      index_root: safeString(profile.index_root || repo?.index_root || 'index', 120),
      key_has_token: Boolean(key?.token || (key?.token_env && process.env[String(key.token_env)]) || key?.token_file || key?.dry_run),
      allowed_by_repo: repo ? aliasPolicyAllows(repo.allowed_projects || repo.projects || repo.allowedProjects, project) : false,
      allowed_by_key: key ? aliasPolicyAllows(key.allowed_repo_aliases || key.repos || key.allowedRepos, repoAlias) : false,
      mode: safeString(profile.mode || 'roundpack_archive', 80),
      default: Boolean(profile.default)
    };
  });
  const projects = [...new Set(bindings.map((item) => item.project).filter(Boolean))].sort();
  return {
    ok: true,
    schema_version: 'openpatch.config_snapshot.v13',
    files: { routes_file: ROUTES_FILE, repos_file: REPOS_FILE, keys_file: KEYS_FILE },
    counts: { route_profiles: profiles.length, repo_aliases: repos.length, key_aliases: keys.length, projects: projects.length },
    projects,
    bindings,
    repos: repos.map((repo) => ({ repo_alias: safeId(repo.repo_alias || repo.alias || '', ''), provider: safeString(repo.provider || 'github', 40), owner: safeString(repo.owner || '', 120), repo: safeString(repo.repo || '', 120), branch: safeString(repo.branch || '', 120), archive_root: safeString(repo.archive_root || 'rounds', 120), index_root: safeString(repo.index_root || 'index', 120), dry_run: Boolean(repo.dry_run), allowed_projects: asArray(repo.allowed_projects || repo.projects || repo.allowedProjects).map((x) => safeId(x, '')) })),
    keys: keys.map((key) => ({ key_alias: safeId(key.key_alias || key.alias || '', ''), provider: safeString(key.provider || 'github', 40), token_env: safeString(key.token_env || '', 160), token_file_set: Boolean(key.token_file), has_inline_token: Boolean(key.token), dry_run: Boolean(key.dry_run), allowed_repo_aliases: asArray(key.allowed_repo_aliases || key.repos || key.allowedRepos).map((x) => safeId(x, '')) })),
    generated_at: nowIso()
  };
}

function aliasPolicyAllows(policyList, value) {
  const list = asArray(policyList).map((item) => safeId(item, '')).filter(Boolean);
  if (!list.length) return true;
  return list.includes('*') || list.includes(safeId(value, ''));
}

async function configLint() {
  const routes = await readJson(ROUTES_FILE, { profiles: [] });
  const reposRaw = await readJson(REPOS_FILE, { repos: [] });
  const keysRaw = await readJson(KEYS_FILE, { keys: [] });
  const profiles = asArray(routes.profiles);
  const repos = asArray(reposRaw.repos);
  const keys = asArray(keysRaw.keys);
  const warnings = [];
  const errors = [];
  const repoAliases = new Map();
  for (const repo of repos) {
    const alias = safeId(repo.repo_alias || repo.alias || '', '');
    if (!alias) errors.push({ code: 'repo_alias_missing', repo: { owner: safeString(repo.owner || '', 80), repo: safeString(repo.repo || '', 80) } });
    if (alias && repoAliases.has(alias)) errors.push({ code: 'repo_alias_duplicate', alias });
    if (alias) repoAliases.set(alias, repo);
    const branch = String(repo.branch || '').toLowerCase();
    if (!repo.dry_run && ['main', 'master', 'production', 'release'].includes(branch)) warnings.push({ code: 'repo_branch_high_impact', alias, branch, recommendation: 'use a dedicated archive branch or explicit owner-approved route profile' });
    if (!repo.owner || !repo.repo) errors.push({ code: 'repo_target_incomplete', alias });
    if (!repo.archive_root) warnings.push({ code: 'repo_archive_root_defaulted', alias, default_value: 'rounds' });
  }
  const keyAliases = new Map();
  for (const key of keys) {
    const alias = safeId(key.key_alias || key.alias || '', '');
    if (!alias) errors.push({ code: 'key_alias_missing', key: { provider: key.provider || '' } });
    if (alias && keyAliases.has(alias)) errors.push({ code: 'key_alias_duplicate', alias });
    if (alias) keyAliases.set(alias, key);
    const hasKeyMaterial = Boolean(key.token || key.token_env || key.token_file || key.dry_run);
    if (!hasKeyMaterial) warnings.push({ code: 'key_material_unresolved', alias, recommendation: 'provide token_env/token_file or mark dry_run for this local key alias' });
  }
  for (const profile of profiles) {
    const profileId = safeId(profile.profile_id || profile.route_profile || profile.routeProfile || profile.id || '', '');
    const project = safeId(profile.project || '', 'default');
    const repoAlias = safeId(profile.repo_alias || profile.repoAlias || '', '');
    const keyAlias = safeId(profile.key_alias || profile.keyAlias || '', '');
    if (!profileId) warnings.push({ code: 'route_profile_id_missing', project });
    if (!repoAlias) warnings.push({ code: 'route_repo_alias_empty', profile: profileId, project });
    if (!keyAlias) warnings.push({ code: 'route_key_alias_empty', profile: profileId, project });
    const repo = repoAliases.get(repoAlias);
    const key = keyAliases.get(keyAlias);
    if (repoAlias && !repo) errors.push({ code: 'route_repo_alias_missing', profile: profileId, repo_alias: repoAlias });
    if (keyAlias && !key) errors.push({ code: 'route_key_alias_missing', profile: profileId, key_alias: keyAlias });
    if (repo && !aliasPolicyAllows(repo.allowed_projects || repo.projects || repo.allowedProjects, project)) errors.push({ code: 'route_project_not_allowed_by_repo_alias', profile: profileId, project, repo_alias: repoAlias });
    if (key && !aliasPolicyAllows(key.allowed_repo_aliases || key.repos || key.allowedRepos, repoAlias)) errors.push({ code: 'route_repo_not_allowed_by_key_alias', profile: profileId, repo_alias: repoAlias, key_alias: keyAlias });
  }
  const routeConflicts = await detectRouteConflicts({});
  for (const issue of routeConflicts.issues || []) {
    const target = issue.severity === 'error' ? errors : warnings;
    target.push({ code: 'route_conflict', issue_type: issue.type, detail: issue });
  }
  const snapshot = await configSnapshot();
  return {
    ok: errors.length === 0,
    schema_version: 'openpatch.config_lint.v13',
    errors,
    warnings,
    summary: {
      repo_count: repos.length,
      key_alias_count: keys.length,
      route_profile_count: profiles.length,
      project_count: snapshot.projects.length,
      binding_count: snapshot.bindings.length,
      error_count: errors.length,
      warning_count: warnings.length
    },
    binding_summary: snapshot.bindings.map((binding) => ({ profile_id: binding.profile_id, project: binding.project, repo_alias: binding.repo_alias, key_alias: binding.key_alias, repo_known: binding.repo_known, key_known: binding.key_known, allowed_by_repo: binding.allowed_by_repo, allowed_by_key: binding.allowed_by_key, repo_dry_run: binding.repo_dry_run })),
    recommended_agent_action: errors.length ? 'fix_config_before_real_upload' : (warnings.length ? 'review_warnings_then_continue' : 'continue'),
    checked_at: nowIso()
  };
}

async function projectList() {
  const snapshot = await configSnapshot();
  const latestByProject = {};
  for (const project of snapshot.projects) latestByProject[project] = await readJson(path.join(LATEST_DIR, `${project}.json`), null);
  return { ok: true, schema_version: 'openpatch.project_list.v13', projects: snapshot.projects.map((project) => ({ project, latest_round: latestByProject[project]?.latest_round || '', latest_status: latestByProject[project]?.status || 'missing', bindings: snapshot.bindings.filter((binding) => binding.project === project) })), generated_at: nowIso() };
}

async function agentNextAction(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const target = safeId(body.target || 'bridge-only', 'bridge-only');
  const readiness = await readinessReport({ project, target });
  const compact = await compactSummary(project);
  const lint = await configLint();
  const actions = [];
  if (!lint.ok) actions.push({ priority: 0, action: 'fix_config_lint_errors', command: `node local-bridge/openpatch-ledger-cli.mjs config-lint`, reason: 'config errors block reliable routing/upload' });
  if (compact.latest_round) actions.push({ priority: 10, action: 'read_latest_receipt', command: `node local-bridge/openpatch-ledger-cli.mjs receipt --project ${project} --round ${compact.latest_round}`, reason: 'latest archived round exists' });
  else actions.push({ priority: 10, action: 'request_roundpack_then_archive', command: `node local-bridge/openpatch-ledger-cli.mjs auto-continue-plan --project ${project} --message-count ${Number(body.message_count || 0)} --force`, reason: 'no latest round for this project' });
  actions.push({ priority: 20, action: 'check_readiness', command: `node local-bridge/openpatch-ledger-cli.mjs readiness --project ${project} --target ${target}`, reason: `current go/no-go is ${readiness.go_no_go}` });
  actions.push({ priority: 30, action: 'inspect_queue', command: `node local-bridge/openpatch-ledger-cli.mjs queue-stats --project ${project}`, reason: 'claim/retry/release tasks if needed' });
  return { ok: true, schema_version: 'openpatch.agent_next_action.v13', project, target, go_no_go: readiness.go_no_go, recommended_agent_action: actions[0]?.action || 'continue', actions, compact, readiness_compact: readiness.compact, generated_at: nowIso() };
}

function smokeStep(id, title, actor, command, expected, level='safe') {
  return { id, title, actor, command, expected, level };
}

async function smokePlan(body = {}) {
  const target = safeId(body.target || body.mode || 'all', 'all');
  const project = safeId(body.project || 'openpatch-smoke', 'openpatch-smoke');
  const config = await configLint();
  const steps = [];
  if (target === 'all' || target === 'bridge') {
    steps.push(smokeStep('bridge-health', 'Confirm local bridge is alive', 'codex', 'node local-bridge/openpatch-ledger-cli.mjs health', 'ok=true'));
    steps.push(smokeStep('bridge-config-lint', 'Lint repo/key/route aliases without printing secrets', 'codex', 'node local-bridge/openpatch-ledger-cli.mjs config-lint', 'errors=[]'));
    steps.push(smokeStep('bridge-dry-run-archive', 'Dry-run archive a tiny fixture through the bridge', 'codex', `node local-bridge/openpatch-ledger-cli.mjs archive-base64 --project ${project} --round smoke-001 --file webai-roundpack.zip --content-base64 ZHVtbXk= --dry-run`, 'status=dry_run_planned'));
  }
  if (target === 'all' || target === 'chrome') {
    steps.push(smokeStep('chrome-load-unpacked', 'Load unpacked extension in dedicated Chrome Dev profile', 'owner_or_codex_with_approval', 'open browser-smoke/CHROME_DEV_PROFILE_SMOKE_TEST_V17.md', 'extension loads; no real upload required', 'controlled'));
    steps.push(smokeStep('chrome-marker-check', 'Open a ChatGPT page with a test attachment and verify v11 marker/status badge', 'codex_or_owner', 'use page event openpatch:api:get-buttons', 'schemaVersion=openpatch.agent_button.v17', 'controlled'));
  }
  if (target === 'all' || target === 'github') {
    steps.push(smokeStep('github-test-upload', 'Archive-only upload to a single fine-grained PAT test repo', 'codex_with_owner_approval', 'open task_cards/FOR_GITHUB_TEST_UPLOAD_V17.md', 'receipt/latest/result created in archive repo', 'approval_required'));
  }
  if (target === 'all' || target === 'auto-continue') {
    steps.push(smokeStep('auto-continue-adapter', 'Install adapter into the current Auto Continue script as a module, not a hard merge', 'codex_or_ai_author', 'open auto-continue-integration/AUTO_CONTINUE_LIVE_ADAPTER_V17.md', 'adapter can request roundpack and wait for archive receipt', 'controlled'));
  }
  return {
    ok: true,
    schema_version: 'openpatch.smoke_plan.v17',
    project,
    target,
    config_lint: { ok: config.ok, errors: config.errors.length, warnings: config.warnings.length },
    steps,
    stop_conditions: ['bridge health fails', 'config-lint has errors before real upload', 'route conflict is ambiguous', 'GitHub upload is not archive-only', 'unexpected token/key value appears in output'],
    created_at: nowIso()
  };
}

async function listInstances() {
  const data = await readJson(INSTANCES_FILE, { schema_version: 'openpatch.browser_instances.v1', instances: [], updated_at: nowIso() });
  const now = Date.now();
  const instances = (Array.isArray(data.instances) ? data.instances : []).map((item) => ({
    ...item,
    stale: Boolean(item.last_seen_at && Date.parse(item.last_seen_at) + Math.max(60_000, Number(item.ttl_ms || 10 * 60 * 1000)) < now)
  }));
  return { ok: true, schema_version: 'openpatch.browser_instances.v1', instances, updated_at: data.updated_at || nowIso() };
}

async function registerInstance(body = {}) {
  return withLock('instances', async () => {
    const data = await readJson(INSTANCES_FILE, { schema_version: 'openpatch.browser_instances.v1', instances: [], updated_at: nowIso() });
    const now = nowIso();
    const instanceId = safeId(body.instance_id || body.instanceId || body.page_session_id || body.pageSessionId || crypto.randomUUID(), 'instance');
    const next = {
      schema_version: 'openpatch.browser_instance.v1',
      instance_id: instanceId,
      browser_profile: safeString(body.browser_profile || body.browserProfile || '', 160),
      page_url_host: hostOnly(body.page_url || body.pageUrl || ''),
      project_hint: safeId(body.project || body.project_hint || body.projectHint || '', ''),
      route_profile: safeId(body.route_profile || body.routeProfile || '', ''),
      capabilities: Array.isArray(body.capabilities) ? body.capabilities.map((x) => safeString(x, 80)).slice(0, 30) : [],
      ttl_ms: Math.max(60_000, Math.min(24 * 60 * 60 * 1000, Number(body.ttl_ms || body.ttlMs || 10 * 60 * 1000))),
      first_seen_at: now,
      last_seen_at: now
    };
    const items = Array.isArray(data.instances) ? data.instances : [];
    const existing = items.find((item) => item.instance_id === instanceId);
    if (existing) next.first_seen_at = existing.first_seen_at || now;
    data.instances = [next, ...items.filter((item) => item.instance_id !== instanceId)].slice(0, 500);
    data.updated_at = now;
    await writeJsonAtomic(INSTANCES_FILE, data);
    await appendEvent('browser_instance_registered', { instance_id: instanceId, project_hint: next.project_hint, route_profile: next.route_profile });
    return { ok: true, schema_version: 'openpatch.instance_register.v11', instance: next };
  });
}


async function instancesCompact(body = {}) {
  const data = await readJson(INSTANCES_FILE, { schema_version: 'openpatch.browser_instances.v1', instances: [] });
  const nowMs = Date.now();
  const items = Array.isArray(data.instances) ? data.instances : [];
  const byProject = {};
  const byRoute = {};
  const stale = [];
  const active = [];
  for (const item of items) {
    const ttlMs = Number(item.ttl_ms || 10 * 60 * 1000);
    const lastSeenMs = Date.parse(item.last_seen_at || item.first_seen_at || '') || 0;
    const isStale = lastSeenMs && (nowMs - lastSeenMs > ttlMs);
    const project = safeId(item.project_hint || item.project || 'unknown', 'unknown');
    const route = safeId(item.route_profile || 'unknown', 'unknown');
    const bucket = { instance_id: item.instance_id, browser_profile: item.browser_profile || '', page_url_host: item.page_url_host || '', project_hint: project, route_profile: route, stale: Boolean(isStale), last_seen_at: item.last_seen_at || '' };
    if (isStale) stale.push(bucket); else active.push(bucket);
    byProject[project] = Number(byProject[project] || 0) + 1;
    byRoute[route] = Number(byRoute[route] || 0) + 1;
  }
  const duplicateRouteGroups = Object.entries(byRoute).filter(([, count]) => count > 1).map(([route_profile, count]) => ({ route_profile, count }));
  const recommended = stale.length ? 'prune_stale_instances_then_continue' : (duplicateRouteGroups.length ? 'review_duplicate_active_routes_before_upload' : 'instances_ok');
  return {
    ok: true,
    schema_version: 'openpatch.instances_compact.v14',
    total_instances: items.length,
    active_count: active.length,
    stale_count: stale.length,
    by_project: byProject,
    by_route_profile: byRoute,
    duplicate_route_groups: duplicateRouteGroups,
    active_sample: active.slice(0, 25),
    stale_sample: stale.slice(0, 25),
    recommended_agent_action: recommended,
    checked_at: nowIso()
  };
}

async function githubUploadGate(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const suppliedRouteContext = body.route_context || body.routeContext || null;
  const route = suppliedRouteContext
    ? { ok: true, route_context: suppliedRouteContext, candidates: [], recommended_agent_action: 'use_supplied_route_context' }
    : await resolveRoute({ project_hint: project, page_url: body.page_url || '', title: body.title || '', route_profile: body.route_profile || '' });
  const routeContext = route.route_context || {};
  const repos = await readJson(REPOS_FILE, { repos: [] });
  const keys = await readJson(KEYS_FILE, { keys: [] });
  const repoAlias = safeString(body.repo_alias || routeContext.repo_alias || '', 120);
  const keyAlias = safeString(body.key_alias || routeContext.key_alias || '', 120);
  const repo = (repos.repos || []).find((r) => safeId(r.repo_alias || r.alias || '', '') === safeId(repoAlias, '')) || null;
  const key = (keys.keys || []).find((k) => safeId(k.key_alias || k.alias || '', '') === safeId(keyAlias, '')) || null;
  const lint = await configLint();
  const conflicts = await detectRouteConflicts({ project_hint: project, page_url: body.page_url || '', title: body.title || '' });
  const blockers = [];
  const warnings = [];
  const routeAmbiguous = routeContext?.ambiguity?.status === 'ambiguous' || Boolean(route.ambiguous);
  if (!route.ok) blockers.push('route_unresolved');
  if (routeAmbiguous) blockers.push('route_context_ambiguous');
  if (!repoAlias) blockers.push('repo_alias_missing');
  if (!keyAlias) blockers.push('key_alias_missing');
  if (!repo) blockers.push('repo_alias_not_found');
  if (!key) blockers.push('key_alias_not_found');
  if (conflicts.has_blocking_conflict) blockers.push('route_profile_blocking_conflict');
  if ((lint.errors || []).length) blockers.push('config_lint_errors_present');
  if (repo && Array.isArray(repo.allowed_projects) && repo.allowed_projects.length && !repo.allowed_projects.map((x) => safeId(x, '')).includes(project)) blockers.push('project_not_allowed_for_repo_alias');
  if (key && Array.isArray(key.allowed_repo_aliases) && key.allowed_repo_aliases.length && !key.allowed_repo_aliases.map((x) => safeId(x, '')).includes(safeId(repoAlias, ''))) blockers.push('repo_alias_not_allowed_for_key_alias');
  if (repo?.dry_run) warnings.push('repo_alias_is_dry_run');
  if (key && !key.token && !key.token_env && !key.token_file && !key.dry_run) blockers.push('key_has_no_token_or_token_env_or_token_file');
  if (key?.token_env && !process.env[key.token_env]) warnings.push('token_env_not_set_in_current_process');
  const gate = blockers.length ? 'blocked' : (warnings.length ? 'go_with_warnings' : 'go');
  return {
    ok: true,
    schema_version: 'openpatch.github_upload_gate.v17',
    project,
    gate,
    can_upload: blockers.length === 0,
    route_context: routeContext,
    route_profile: routeContext.route_profile || '',
    route_ambiguity: routeContext.ambiguity || { status: routeAmbiguous ? 'ambiguous' : 'clear' },
    repo_alias: repoAlias,
    key_alias: keyAlias,
    repo_summary: repo ? { owner: repo.owner || '', repo: repo.repo || '', branch: repo.branch || '', archive_root: repo.archive_root || 'rounds', index_root: repo.index_root || 'index', dry_run: Boolean(repo.dry_run), allowed_projects: repo.allowed_projects || [] } : null,
    key_summary: key ? { key_alias: key.key_alias || key.alias || keyAlias, provider: key.provider || 'github', token_env: key.token_env || '', token_file_set: Boolean(key.token_file), has_inline_token: Boolean(key.token), allowed_repo_aliases: key.allowed_repo_aliases || [] } : null,
    blockers,
    warnings,
    recommended_agent_action: blockers.length ? 'fix_gate_blockers_before_real_upload' : 'archive_or_run_single_test_upload',
    checked_at: nowIso()
  };
}

async function autoContinuePreflight(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const messageCount = Number(body.message_count || body.messageCount || 0);
  const plan = await autoContinuePlan({ ...body, project, message_count: messageCount });
  const summary = await compactSummary(project);
  const instances = await instancesCompact({ project });
  const conflicts = await detectRouteConflicts({ project_hint: project, page_url: body.page_url || '', title: body.title || '' });
  const shouldPause = Boolean(plan.should_pause || plan.should_request_roundpack || conflicts.has_blocking_conflict || instances.stale_count > 0);
  return {
    ok: true,
    schema_version: 'openpatch.auto_continue_preflight.v17',
    project,
    should_pause: shouldPause,
    should_request_roundpack: Boolean(plan.should_request_roundpack),
    plan,
    compact_summary: summary,
    instances_compact: instances,
    route_conflicts: { issue_count: conflicts.issue_count, has_blocking_conflict: conflicts.has_blocking_conflict, recommended_agent_action: conflicts.recommended_agent_action },
    recommended_agent_action: shouldPause ? 'pause_or_request_roundpack_before_next_continue' : 'continue_auto_flow',
    checked_at: nowIso()
  };
}

async function preflightBundle(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const target = safeString(body.target || 'bridge-only', 80);
  const [readiness, handoff, evidence, config, snapshot, projects, compact, instances, gate, next] = await Promise.all([
    readinessReport({ project, target }),
    codexHandoff({ project, target }),
    evidenceTemplate({ project, target }),
    configLint(),
    configSnapshot(),
    projectList(),
    compactSummary(project),
    instancesCompact({ project }),
    githubUploadGate({ project, page_url: body.page_url || '', title: body.title || '', route_profile: body.route_profile || '' }),
    agentNextAction({ project, target, message_count: Number(body.message_count || 0) })
  ]);
  const blockers = [];
  if (readiness.go_no_go === 'no_go') blockers.push('readiness_no_go');
  if ((config.errors || []).length) blockers.push('config_lint_errors');
  if (['github', 'all', 'real-upload'].includes(target) && gate.gate === 'blocked') blockers.push('github_upload_gate_blocked');
  if (instances.stale_count > 20) blockers.push('too_many_stale_instances');
  const result = blockers.length ? 'no_go' : ((readiness.go_no_go === 'go_with_warnings' || gate.gate === 'go_with_warnings' || (config.warnings || []).length) ? 'go_with_warnings' : 'go');
  return {
    ok: true,
    schema_version: 'openpatch.preflight_bundle.v17',
    project,
    target,
    result,
    blockers,
    recommended_agent_action: blockers.length ? 'fix_preflight_blockers_before_smoke' : 'run_codex_handoff_or_single_smoke',
    codex_short_command: `node local-bridge/openpatch-ledger-cli.mjs preflight --project ${project} --target ${target}`,
    default_next_commands: [
      `node local-bridge/openpatch-ledger-cli.mjs readiness --project ${project} --target ${target}`,
      `node local-bridge/openpatch-ledger-cli.mjs github-upload-gate --project ${project}`,
      `node local-bridge/openpatch-ledger-cli.mjs evidence-template --project ${project} --target ${target}`
    ],
    readiness,
    codex_handoff: handoff,
    evidence_template: evidence,
    config_lint: config,
    config_snapshot: snapshot,
    projects,
    compact_summary: compact,
    instances_compact: instances,
    github_upload_gate: gate,
    next_action: next,
    checked_at: nowIso()
  };
}


async function codexBrief(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const target = safeString(body.target || 'bridge-only', 80);
  const preflight = await preflightBundle({ ...body, project, target });
  const latest = preflight.compact_summary || await compactSummary(project);
  const queue = await queueStats(project);
  const brief = {
    ok: true,
    schema_version: 'openpatch.codex_brief.v17',
    project,
    target,
    result: preflight.result,
    latest_round: latest.latest_round || '',
    latest_status: latest.status || 'missing',
    queue_counts: queue.counts || {},
    action_now: preflight.blockers?.length ? 'fix_preflight_blockers' : (latest.latest_round ? 'read_latest_receipt_or_fetch_roundpack' : 'run_bridge_smoke_or_request_roundpack'),
    next_command: preflight.blockers?.length
      ? `node local-bridge/openpatch-ledger-cli.mjs preflight --project ${project} --target ${target}`
      : (latest.latest_round
        ? `node local-bridge/openpatch-ledger-cli.mjs receipt --project ${project} --round ${latest.latest_round}`
        : `node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project ${project}`),
    stop_if: preflight.blockers || [],
    warnings: [
      ...(preflight.readiness?.warnings || []),
      ...(preflight.config_lint?.warnings || []),
      ...(preflight.github_upload_gate?.warnings || [])
    ].slice(0, 12),
    codex_should_read: ['codex_brief', 'latest_or_receipt', 'bridge_smoke_evidence_when_requested'],
    checked_at: nowIso()
  };
  await appendEvent('codex_brief_requested', { project, target, result: brief.result, action_now: brief.action_now });
  return brief;
}

async function bridgeSmokeRun(body = {}) {
  const project = safeId(body.project || body.project_hint || 'openpatch-smoke', 'openpatch-smoke');
  const roundId = safeId(body.round_id || body.roundId || `bridge-smoke-${Date.now()}`, 'bridge-smoke');
  const startedAt = nowIso();
  const commands = [];
  const checks = [];
  async function step(id, fn) {
    const at = nowIso();
    try {
      const result = await fn();
      checks.push({ id, ok: result?.ok !== false, status: result?.status || result?.result || 'ok', at, sample: result });
      return result;
    } catch (error) {
      checks.push({ id, ok: false, status: 'failed', at, error: safeString(error.message, 500) });
      return null;
    }
  }
  const health = await step('health', async () => ({ ok: true, schema_version: 'openpatch.bridge_health_check.v15', root: ROOT }));
  const lint = await step('config_lint', () => configLint());
  const readiness = await step('readiness', () => readinessReport({ project, target: 'bridge-only' }));
  const archive = await step('dry_run_archive', () => archiveBase64({
    project,
    round_id: roundId,
    file_name: 'webai-roundpack-bridge-smoke.zip',
    content_base64: Buffer.from(`bridge-smoke:${project}:${roundId}:${startedAt}`, 'utf8').toString('base64'),
    dry_run: true,
    title: 'bridge smoke dry-run archive'
  }));
  const receipt = await step('latest', () => compactSummary(project));
  const events = await step('events_recent', () => ({ ok: true, events: [] }));
  const pass = checks.every((item) => item.ok) && (lint?.ok !== false) && (readiness?.ok !== false) && Boolean(archive?.ok);
  const blockers = checks.filter((item) => !item.ok).map((item) => ({ id: item.id, status: item.status, error: item.error || '' }));
  const evidence = {
    ok: true,
    schema_version: 'openpatch.bridge_smoke_evidence.v17',
    project,
    round_id: roundId,
    target: 'bridge-only',
    status: pass ? 'pass' : 'blocked',
    pass,
    started_at: startedAt,
    finished_at: nowIso(),
    checks: checks.map((item) => ({ id: item.id, ok: item.ok, status: item.status, at: item.at, error: item.error || '' })),
    blockers,
    warnings: [
      ...(lint?.warnings || []),
      ...(readiness?.warnings || [])
    ].slice(0, 20),
    latest_round: receipt?.latest_round || archive?.round_id || '',
    dry_run_receipt: archive || null,
    next_recommended_action: pass ? 'proceed_to_chrome_dev_profile_smoke_or_github_test_upload_gate' : 'fix_bridge_smoke_blockers_then_retry',
    codex_next_command: pass
      ? `node local-bridge/openpatch-ledger-cli.mjs codex-brief --project ${project}`
      : `node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project ${project}`
  };
  const evidencePath = path.join(ROOT, 'evidence', project, `${roundId}.json`);
  await writeJsonAtomic(evidencePath, evidence);
  await appendEvent('bridge_smoke_run', { project, round_id: roundId, pass, evidence_path: evidencePath });
  return { ...evidence, evidence_path: evidencePath };
}

async function operationBrief(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const intent = safeString(body.intent || 'continue', 80);
  const [brief, next, auto, instances, queue] = await Promise.all([
    codexBrief({ ...body, project }),
    agentNextAction({ ...body, project }),
    autoContinuePreflight({ ...body, project }),
    instancesCompact({ project }),
    queueStats(project)
  ]);
  const recommended = intent === 'auto-continue'
    ? auto.recommended_agent_action
    : (brief.action_now || next.recommended_agent_action);
  return {
    ok: true,
    schema_version: 'openpatch.operation_brief.v17',
    project,
    intent,
    recommended_agent_action: recommended,
    one_line: `${project}: ${brief.result}; ${recommended}`,
    command_to_run: brief.next_command,
    can_continue_auto: auto.should_pause === false,
    should_pause_auto: Boolean(auto.should_pause),
    queue_counts: queue.counts || {},
    active_instances: instances.active_count || 0,
    stale_instances: instances.stale_count || 0,
    brief,
    next_action: next.actions?.[0] || null,
    auto_continue: { should_pause: auto.should_pause, should_request_roundpack: auto.should_request_roundpack, action: auto.recommended_agent_action },
    generated_at: nowIso()
  };
}


async function smokeNextHop(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const target = safeString(body.target || 'all', 80);
  const brief = await codexBrief({ ...body, project, target: target === 'all' ? 'bridge-only' : target });
  const preflight = await preflightBundle({ ...body, project, target: target === 'all' ? 'bridge-only' : target });
  const chrome = await chromeSmokeHandoff({ ...body, project });
  const github = await githubTestUploadHandoff({ ...body, project });
  const auto = await autoContinueLiveHandoff({ ...body, project });
  const sequence = [
    { id: 'bridge_only', status: brief.result, command: `node local-bridge/openpatch-ledger-cli.mjs bridge-smoke-run --project ${project}`, evidence: 'bridge_smoke_evidence.json' },
    { id: 'chrome_dev_profile', status: 'ready_when_bridge_passes', command: `node local-bridge/openpatch-ledger-cli.mjs chrome-smoke-handoff --project ${project}`, evidence: 'chrome_dev_profile_smoke_evidence.json' },
    { id: 'github_test_upload', status: github.gate === 'blocked' ? 'needs_config_or_token' : 'ready_for_test_repo', command: `node local-bridge/openpatch-ledger-cli.mjs github-test-upload-handoff --project ${project}`, evidence: 'github_test_upload_evidence.json' },
    { id: 'auto_continue_live_adapter', status: 'ready_after_page_marker_and_bridge_receipt', command: `node local-bridge/openpatch-ledger-cli.mjs auto-continue-live-handoff --project ${project}`, evidence: 'auto_continue_live_adapter_evidence.json' }
  ];
  return {
    ok: true,
    schema_version: 'openpatch.smoke_next_hop.v17',
    project,
    target,
    action_now: brief.action_now || preflight.recommended_agent_action,
    one_line: `${project}: run bridge-only smoke first, then Chrome Dev profile smoke, then single test-repo upload, then Auto Continue adapter smoke.`,
    sequence,
    compact: {
      preflight_result: preflight.result,
      latest_round: brief.latest_round || '',
      latest_status: brief.latest_status || 'missing',
      queue_counts: brief.queue_counts || {}
    },
    handoff_refs: {
      chrome: chrome.schema_version,
      github: github.schema_version,
      auto_continue: auto.schema_version
    },
    recommended_agent_action: preflight.blockers?.length ? 'fix_preflight_blockers_then_rerun_next_hop' : 'run_bridge_smoke_then_follow_sequence',
    generated_at: nowIso()
  };
}

async function chromeSmokeHandoff(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const instanceId = safeId(body.instance_id || `chrome-dev-${project}-${Date.now()}`, 'chrome-dev-instance');
  return {
    ok: true,
    schema_version: 'openpatch.chrome_smoke_handoff.v17',
    project,
    purpose: 'load the unpacked extension in an isolated Chrome Dev profile and verify marker/API/bridge status without touching real accounts beyond the test chat page selected by owner',
    default_commands: [
      `node local-bridge/openpatch-ledger-cli.mjs health`,
      `node local-bridge/openpatch-ledger-cli.mjs preflight --project ${project} --target chrome`,
      `node local-bridge/openpatch-ledger-cli.mjs instances-register --instance ${instanceId} --project ${project} --browser-profile chrome-dev-openpatch-smoke`,
      `node local-bridge/openpatch-ledger-cli.mjs instances-compact`,
      `node local-bridge/openpatch-ledger-cli.mjs operation-brief --project ${project} --intent smoke`
    ],
    browser_expectations: [
      'extension loads without manifest/runtime errors',
      'OpenPatch buttons expose data-openpatch-marker=openpatch.agent_button.v17',
      'page event API answers get-buttons/get-agent-summary/get-route-visual',
      'bridge status badge is visible or marker reports bridgeStatusHint',
      'no token value is printed in page DOM or console summaries'
    ],
    evidence_required: [
      'chrome_extension_load_status.json',
      'button_marker_sample.json',
      'page_api_get_buttons.json',
      'bridge_health.json',
      'instances_compact.json',
      'console_error_summary.txt'
    ],
    codex_output_template: {
      schema_version: 'openpatch.chrome_smoke_evidence.v17',
      project,
      instance_id: instanceId,
      pass: false,
      files_created: [],
      console_errors: [],
      marker_sample: null,
      next_recommended_action: ''
    },
    recommended_agent_action: 'run_chrome_dev_profile_smoke_and_return_evidence_json',
    generated_at: nowIso()
  };
}

async function githubTestUploadHandoff(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const gate = await githubUploadGate(body.project ? body : { ...body, project });
  const roundId = safeId(body.round_id || `github-test-${Date.now()}`, 'github-test');
  const fileName = sanitizeFileName(body.file_name || `webai-roundpack-${project}-github-test.zip`);
  const payload = Buffer.from(`openpatch-github-test:${project}:${roundId}:${nowIso()}`, 'utf8').toString('base64');
  return {
    ok: true,
    schema_version: 'openpatch.github_test_upload_handoff.v17',
    project,
    gate: gate.gate || 'unknown',
    can_upload: Boolean(gate.can_upload),
    repo_alias: gate.repo_alias || safeString(body.repo_alias || '', 120),
    key_alias: gate.key_alias || safeString(body.key_alias || '', 120),
    default_commands: [
      `node local-bridge/openpatch-ledger-cli.mjs github-upload-gate --project ${project}`,
      `node local-bridge/openpatch-ledger-cli.mjs archive-base64 --project ${project} --round ${roundId} --file ${fileName} --content-base64 ${payload} --dry-run`,
      `node local-bridge/openpatch-ledger-cli.mjs compact-summary --project ${project}`,
      `node local-bridge/openpatch-ledger-cli.mjs receipt --project ${project} --round ${roundId}`
    ],
    real_upload_command_template: `node local-bridge/openpatch-ledger-cli.mjs archive-base64 --project ${project} --round ${roundId} --file ${fileName} --content-base64 <base64-roundpack> --repo-alias <test_repo_alias> --key-alias <test_key_alias>`,
    evidence_required: [
      'github_upload_gate.json',
      'archive_receipt.json',
      'latest_after_upload.json',
      'github_path_or_dry_run_path.txt',
      'rate_limit_status.json'
    ],
    gate_summary: { blockers: gate.blockers || [], warnings: gate.warnings || [] },
    recommended_agent_action: gate.can_upload ? 'run_single_test_repo_archive_upload_or_dry_run_first' : 'fix_repo_key_route_gate_then_retry',
    generated_at: nowIso()
  };
}

async function autoContinueLiveHandoff(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const interval = Math.max(1, Number(body.roundpack_interval || body.roundpackInterval || 5));
  const plan = await autoContinuePlan({ ...body, project, roundpack_interval: interval, message_count: Number(body.message_count || 0) });
  return {
    ok: true,
    schema_version: 'openpatch.auto_continue_live_handoff.v17',
    project,
    roundpack_interval: interval,
    adapter_contract: {
      outbound_events: ['openpatch:api:get-agent-summary', 'openpatch:api:get-roundpack-prompt', 'openpatch:api:trigger-upload'],
      inbound_events: ['openpatch:agent-status', 'openpatch:api:agent-summary', 'openpatch:api:roundpack-prompt'],
      required_marker: '[ROUND_PACK_READY]',
      pause_conditions: ['roundpack_required_but_missing', 'route_conflict_blocking', 'archive_upload_in_progress', 'upload_failed_needs_retry']
    },
    default_commands: [
      `node local-bridge/openpatch-ledger-cli.mjs auto-continue-preflight --project ${project} --message-count 0`,
      `node local-bridge/openpatch-ledger-cli.mjs operation-brief --project ${project} --intent auto-continue`,
      `node local-bridge/openpatch-ledger-cli.mjs compact-summary --project ${project}`
    ],
    plan_sample: plan,
    evidence_required: [
      'auto_continue_preflight_before.json',
      'roundpack_prompt_used.txt',
      'round_pack_ready_marker.json',
      'openpatch_agent_status_events.json',
      'archive_receipt_after.json'
    ],
    recommended_agent_action: 'wire_adapter_as_optional_layer_then_smoke_with_one_test_chat',
    generated_at: nowIso()
  };
}

async function evidencePack(body = {}) {
  const project = safeId(body.project || body.project_hint || 'default', 'default');
  const target = safeId(body.target || 'bridge-only', 'bridge-only');
  const roundId = safeId(body.round_id || body.roundId || `evidence-${Date.now()}`, 'evidence');
  const payload = body.payload || body.evidence || body;
  const pack = {
    ok: true,
    schema_version: 'openpatch.evidence_pack.v17',
    project,
    target,
    round_id: roundId,
    payload_sha256: sha256Text(JSON.stringify(payload)),
    summary: safeString(body.summary || body.note || '', 1000),
    payload,
    received_at: nowIso()
  };
  const evidencePath = path.join(ROOT, 'evidence-packs', project, `${roundId}.json`);
  await writeJsonAtomic(evidencePath, pack);
  await appendEvent('evidence_pack_saved', { project, target, round_id: roundId, evidence_path: evidencePath });
  return { ...pack, evidence_path: evidencePath };
}

async function handle(req, res) {
  if (req.method === "OPTIONS") return jsonResponse(res, 200, { ok: true });
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);


  if (req.method === "POST" && url.pathname === "/smoke/next-hop") return jsonResponse(res, 200, await smokeNextHop(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/smoke/next-hop") return jsonResponse(res, 200, await smokeNextHop({ project: url.searchParams.get("project") || "default", target: url.searchParams.get("target") || "all" }));
  if (req.method === "POST" && url.pathname === "/chrome/smoke-handoff") return jsonResponse(res, 200, await chromeSmokeHandoff(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/chrome/smoke-handoff") return jsonResponse(res, 200, await chromeSmokeHandoff({ project: url.searchParams.get("project") || "default" }));
  if (req.method === "POST" && url.pathname === "/github/test-upload-handoff") return jsonResponse(res, 200, await githubTestUploadHandoff(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/github/test-upload-handoff") return jsonResponse(res, 200, await githubTestUploadHandoff({ project: url.searchParams.get("project") || "default", repo_alias: url.searchParams.get("repo_alias") || "", key_alias: url.searchParams.get("key_alias") || "" }));
  if (req.method === "POST" && url.pathname === "/auto-continue/live-handoff") return jsonResponse(res, 200, await autoContinueLiveHandoff(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/auto-continue/live-handoff") return jsonResponse(res, 200, await autoContinueLiveHandoff({ project: url.searchParams.get("project") || "default", roundpack_interval: Number(url.searchParams.get("interval") || 5) }));
  if (req.method === "POST" && url.pathname === "/smoke/evidence-pack") return jsonResponse(res, 200, await evidencePack(await collectBody(req)));

  if (req.method === "POST" && url.pathname === "/codex/brief") return jsonResponse(res, 200, await codexBrief(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/codex/brief") return jsonResponse(res, 200, await codexBrief({ project: url.searchParams.get("project") || "default", target: url.searchParams.get("target") || "bridge-only" }));
  if (req.method === "POST" && url.pathname === "/smoke/bridge-only/run") return jsonResponse(res, 200, await bridgeSmokeRun(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/operation/brief") return jsonResponse(res, 200, await operationBrief(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/operation/brief") return jsonResponse(res, 200, await operationBrief({ project: url.searchParams.get("project") || "default", intent: url.searchParams.get("intent") || "continue" }));

  if (req.method === "POST" && url.pathname === "/preflight") return jsonResponse(res, 200, await preflightBundle(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/github/upload-gate") return jsonResponse(res, 200, await githubUploadGate(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/auto-continue/preflight") return jsonResponse(res, 200, await autoContinuePreflight(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/instances/compact") return jsonResponse(res, 200, await instancesCompact({}));
  if (req.method === "POST" && url.pathname === "/instances/compact") return jsonResponse(res, 200, await instancesCompact(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/health") return jsonResponse(res, 200, { ok: true, schema_version: "openpatch.bridge_health.v17", service: "openpatch-local-bridge", root: ROOT, capabilities: ["routes", "resolve_route", "receipts", "latest", "sha_index", "queue", "config_status", "archive_base64", "bridge_side_github_upload", "agent_summary", "receipt_query", "queue_claim", "queue_retry", "auto_continue_plan", "events", "compact_summary", "recent_receipts", "queue_stats", "queue_claim_batch", "queue_release", "lease_reclaim", "github_rate_backoff", "events_compact", "archive_size_guard", "stress_test_ready", "route_conflict_detector", "queue_reclaim_expired", "route_ambiguity_report", "route_visual_map", "route_fix_suggestions", "route_resolution_stress", "multi_browser_planning", "config_lint", "smoke_plan", "browser_instance_registry", "real_smoke_handoff", "readiness_report", "codex_handoff", "evidence_template", "instances_prune_stale", "config_snapshot", "projects", "agent_next_action", "alias_binding_lint", "preflight_bundle", "github_upload_gate", "auto_continue_preflight", "instances_compact", "codex_brief", "bridge_smoke_run", "operation_brief", "smoke_next_hop", "chrome_smoke_handoff", "github_test_upload_handoff", "auto_continue_live_handoff", "evidence_pack"], time: nowIso() });
  if (req.method === "GET" && url.pathname === "/config-status") return jsonResponse(res, 200, await sanitizedConfigStatus());
  if (req.method === "GET" && url.pathname === "/config/snapshot") return jsonResponse(res, 200, await configSnapshot());
  if (req.method === "GET" && url.pathname === "/projects") return jsonResponse(res, 200, await projectList());
  if (req.method === "GET" && url.pathname === "/config-lint") return jsonResponse(res, 200, await configLint());
  if (req.method === "GET" && url.pathname === "/instances") return jsonResponse(res, 200, await listInstances());
  if (req.method === "POST" && url.pathname === "/instances/prune-stale") return jsonResponse(res, 200, await pruneStaleInstances(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/instances/register") return jsonResponse(res, 200, await registerInstance(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/smoke/plan") return jsonResponse(res, 200, await smokePlan(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/readiness") return jsonResponse(res, 200, await readinessReport(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/codex/handoff") return jsonResponse(res, 200, await codexHandoff(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/smoke/evidence-template") return jsonResponse(res, 200, await evidenceTemplate(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/routes") return jsonResponse(res, 200, await readJson(ROUTES_FILE, { profiles: [] }));
  if (req.method === "GET" && url.pathname === "/routes/conflicts") return jsonResponse(res, 200, await detectRouteConflicts({}));
  if (req.method === "POST" && url.pathname === "/routes/conflicts") return jsonResponse(res, 200, await detectRouteConflicts(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/routes/visual-map") return jsonResponse(res, 200, await buildRouteVisualMap({}));
  if (req.method === "POST" && url.pathname === "/routes/visual-map") return jsonResponse(res, 200, await buildRouteVisualMap(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/routes/fix-suggestions") return jsonResponse(res, 200, await suggestRouteFixes({}));
  if (req.method === "POST" && url.pathname === "/routes/fix-suggestions") return jsonResponse(res, 200, await suggestRouteFixes(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/stress/routes") return jsonResponse(res, 200, await stressResolveRoutes(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/repos") return jsonResponse(res, 200, (await sanitizedConfigStatus()).repos);
  if (req.method === "GET" && url.pathname === "/keys") return jsonResponse(res, 200, (await sanitizedConfigStatus()).keys);
  if (req.method === "POST" && url.pathname === "/resolve-route") return jsonResponse(res, 200, await resolveRoute(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/agent/summary") return jsonResponse(res, 200, await agentSummary(url.searchParams.get("project") || "default"));
  if (req.method === "GET" && url.pathname === "/agent/compact-summary") return jsonResponse(res, 200, await compactSummary(url.searchParams.get("project") || "default"));
  if (req.method === "POST" && url.pathname === "/agent/next-action") return jsonResponse(res, 200, await agentNextAction(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/receipt") return jsonResponse(res, 200, await getReceiptQuery(url.searchParams));
  if (req.method === "GET" && url.pathname === "/receipts/recent") return jsonResponse(res, 200, await recentReceipts(url.searchParams));
  if (req.method === "GET" && url.pathname === "/events") return jsonResponse(res, 200, { ok: true, schema_version: "openpatch.bridge_events.v1", events: await readRecentEvents(Number(url.searchParams.get("limit") || 50)) });
  if (req.method === "POST" && url.pathname === "/events/compact") return jsonResponse(res, 200, await compactEvents(Number((await collectBody(req)).max_events || MAX_EVENTS)));
  if (req.method === "GET" && url.pathname === "/rate-limit/status") return jsonResponse(res, 200, githubRateStatus());
  if (req.method === "POST" && url.pathname === "/auto-continue/plan") return jsonResponse(res, 200, await autoContinuePlan(await collectBody(req)));
  if (req.method === "GET" && url.pathname === "/status") return jsonResponse(res, 200, await readJson(STATUS_FILE, { receipts: [] }));
  if (req.method === "GET" && url.pathname === "/latest") { const project = safeId(url.searchParams.get("project") || "default", "default"); return jsonResponse(res, 200, await readJson(path.join(LATEST_DIR, `${project}.json`), { schema_version: "openpatch.bridge_latest.v7", project, status: "missing", latest_round: "" })); }
  if (req.method === "GET" && url.pathname === "/sha-index") return jsonResponse(res, 200, await readJson(SHA_INDEX_FILE, { entries: [] }));
  if (req.method === "GET" && url.pathname === "/queue/status") return jsonResponse(res, 200, await readJson(QUEUE_FILE, { items: [] }));
  if (req.method === "GET" && url.pathname === "/queue/stats") return jsonResponse(res, 200, await queueStats(url.searchParams.get("project") || ""));
  if (req.method === "POST" && url.pathname === "/queue/enqueue") return jsonResponse(res, 200, await enqueueTask(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/queue/claim") return jsonResponse(res, 200, await claimQueueTask(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/queue/claim-batch") return jsonResponse(res, 200, await claimQueueBatch(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/queue/release") return jsonResponse(res, 200, await releaseQueueTask(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/queue/reclaim-expired") return jsonResponse(res, 200, await reclaimExpiredQueueTasks(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/queue/retry") return jsonResponse(res, 200, await retryQueueTask(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/queue/complete") return jsonResponse(res, 200, await updateQueueTask(await collectBody(req), "completed"));
  if (req.method === "POST" && url.pathname === "/queue/fail") return jsonResponse(res, 200, await updateQueueTask(await collectBody(req), "failed"));
  if (req.method === "POST" && url.pathname === "/receipts") return jsonResponse(res, 200, await receiveReceipt(await collectBody(req)));
  if (req.method === "POST" && url.pathname === "/archive/base64") return jsonResponse(res, 200, await archiveBase64(await collectBody(req)));

  return jsonResponse(res, 404, { ok: false, error: "not_found" });
}

await ensureRoot();
const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    const status = error instanceof SyntaxError ? 400 : 500;
    jsonResponse(res, status, { ok: false, error: error.message });
  });
});
server.listen(PORT, "127.0.0.1", () => {
  console.log(JSON.stringify({ ok: true, service: "openpatch-local-bridge", port: PORT, root: ROOT }));
});
