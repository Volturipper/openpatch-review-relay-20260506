#!/usr/bin/env node
const DEFAULT_BRIDGE_URL = process.env.OPENPATCH_BRIDGE_URL || "http://127.0.0.1:17873";

function usage() {
  console.log(`openpatch-ledger-cli

Commands:
  health
  config-status
  config-snapshot
  config-lint
  preflight [--project <project>] [--target <bridge-only|chrome|github|auto-continue>]
  codex-brief [--project <project>] [--target <bridge-only|chrome|github|auto-continue>]
  operation-brief [--project <project>] [--intent <continue|auto-continue|smoke>]
  next-hop [--project <project>] [--target <all|bridge-only|chrome|github|auto-continue>]
  chrome-smoke-handoff [--project <project>]
  github-test-upload-handoff [--project <project>] [--repo-alias <alias>] [--key-alias <alias>]
  auto-continue-live-handoff [--project <project>] [--interval <n>]
  evidence-pack [--project <project>] [--target <target>] [--round <round_id>]
  bridge-smoke-run [--project <project>] [--round <round_id>]
  github-upload-gate [--project <project>] [--url <page_url>] [--title <title>]
  auto-continue-preflight --project <project> [--message-count <n>] [--force]
  instances-compact
  smoke-plan [--target <all|bridge|chrome|github|auto-continue>] [--project <project>]
  readiness [--project <project>] [--target <bridge-only|chrome|github|auto-continue>]
  codex-handoff [--project <project>] [--target <bridge-only|chrome|github|auto-continue>]
  evidence-template [--project <project>] [--target <bridge-only|chrome|github|auto-continue>]
  instances
  instances-register [--instance <id>] [--project <project>] [--route-profile <profile>]
  instances-prune-stale
  projects
  next-action [--project <project>] [--target <target>] [--message-count <n>]
  routes
  routes-conflicts [--url <page_url>] [--title <title>] [--project <project>]
  routes-visual [--url <page_url>] [--title <title>] [--project <project>]
  routes-fix-suggestions [--url <page_url>] [--title <title>] [--project <project>]
  stress-routes --project <project> [--count <n>]
  repos
  keys
  status
  agent-summary --project <project>
  compact-summary --project <project>
  latest --project <project>
  receipt --project <project> --round <round_id>
  receipts-recent [--project <project>] [--limit <n>]
  events [--limit <n>]
  events-compact [--max-events <n>]
  rate-limit-status
  queue
  queue-stats [--project <project>]
  queue-claim [--project <project>] [--agent <name>]
  queue-claim-batch [--project <project>] [--agent <name>] [--max <n>]
  queue-release --project <project> --round <round_id> [--reason <text>]
  queue-reclaim-expired [--project <project>] [--reason <text>]
  queue-retry --project <project> --round <round_id> [--reason <text>]
  auto-continue-plan --project <project> --message-count <n> [--interval <n>] [--force]
  sha-index
  resolve --url <page_url> [--title <title>] [--project <project>]
  enqueue --project <project> --round <round_id> [--sha <sha256>]
  archive-base64 --project <project> --round <round_id> --file <name> --content-base64 <b64> [--repo-alias <alias>] [--key-alias <alias>] [--dry-run]
  stress-archive --project <project> [--count <n>] [--parallel <n>]

Env:
  OPENPATCH_BRIDGE_URL=http://127.0.0.1:17873
`);
}

function getArg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  return process.argv[index + 1] || fallback;
}

function hasFlag(name) { return process.argv.includes(name); }

async function request(path, { method = "GET", body = null } = {}) {
  const response = await fetch(`${DEFAULT_BRIDGE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!response.ok) throw new Error(JSON.stringify({ status: response.status, body: json }));
  return json;
}

async function main() {
  const command = process.argv[2] || "help";
  if (command === "help" || command === "--help" || command === "-h") return usage();

  if (command === "health") return print(await request("/health"));
  if (command === "config-status") return print(await request("/config-status"));
  if (command === "config-snapshot") return print(await request("/config/snapshot"));
  if (command === "config-lint") return print(await request("/config-lint"));
  if (command === "preflight") return print(await request("/preflight", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), target: getArg("--target", "bridge-only"), message_count: Number(getArg("--message-count", "0")), page_url: getArg("--url", ""), title: getArg("--title", "") } }));
  if (command === "codex-brief") return print(await request("/codex/brief", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), target: getArg("--target", "bridge-only"), page_url: getArg("--url", ""), title: getArg("--title", "") } }));
  if (command === "operation-brief") return print(await request("/operation/brief", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), intent: getArg("--intent", "continue"), message_count: Number(getArg("--message-count", "0")), page_url: getArg("--url", ""), title: getArg("--title", "") } }));
  if (command === "next-hop") return print(await request("/smoke/next-hop", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), target: getArg("--target", "all"), page_url: getArg("--url", ""), title: getArg("--title", "") } }));
  if (command === "chrome-smoke-handoff") return print(await request("/chrome/smoke-handoff", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), instance_id: getArg("--instance", "") } }));
  if (command === "github-test-upload-handoff") return print(await request("/github/test-upload-handoff", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), repo_alias: getArg("--repo-alias", ""), key_alias: getArg("--key-alias", ""), round_id: getArg("--round", ""), file_name: getArg("--file", "") } }));
  if (command === "auto-continue-live-handoff") return print(await request("/auto-continue/live-handoff", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), roundpack_interval: Number(getArg("--interval", "5")), message_count: Number(getArg("--message-count", "0")) } }));
  if (command === "evidence-pack") return print(await request("/smoke/evidence-pack", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), target: getArg("--target", "bridge-only"), round_id: getArg("--round", ""), summary: getArg("--summary", "cli evidence pack placeholder"), payload: { actor: getArg("--actor", "codex-or-agent"), created_by_cli: true } } }));
  if (command === "bridge-smoke-run") return print(await request("/smoke/bridge-only/run", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), round_id: getArg("--round", "") } }));
  if (command === "github-upload-gate") return print(await request("/github/upload-gate", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), page_url: getArg("--url", ""), title: getArg("--title", ""), route_profile: getArg("--route-profile", "") } }));
  if (command === "auto-continue-preflight") return print(await request("/auto-continue/preflight", { method: "POST", body: { project: getArg("--project", "openpatch-smoke"), message_count: Number(getArg("--message-count", "0")), force_roundpack: hasFlag("--force"), page_url: getArg("--url", ""), title: getArg("--title", "") } }));
  if (command === "instances-compact") return print(await request("/instances/compact"));
  if (command === "smoke-plan") return print(await request("/smoke/plan", { method: "POST", body: { target: getArg("--target", "all"), project: getArg("--project", "openpatch-smoke") } }));
  if (command === "readiness") return print(await request("/readiness", { method: "POST", body: { target: getArg("--target", "bridge-only"), project: getArg("--project", "openpatch-smoke") } }));
  if (command === "codex-handoff") return print(await request("/codex/handoff", { method: "POST", body: { target: getArg("--target", "bridge-only"), project: getArg("--project", "openpatch-smoke") } }));
  if (command === "evidence-template") return print(await request("/smoke/evidence-template", { method: "POST", body: { target: getArg("--target", "bridge-only"), project: getArg("--project", "openpatch-smoke") } }));
  if (command === "instances") return print(await request("/instances"));
  if (command === "instances-register") return print(await request("/instances/register", { method: "POST", body: { instance_id: getArg("--instance", `cli-${Date.now()}`), project_hint: getArg("--project", ""), route_profile: getArg("--route-profile", ""), browser_profile: getArg("--browser-profile", "cli"), capabilities: ["cli_smoke"] } }));
  if (command === "instances-prune-stale") return print(await request("/instances/prune-stale", { method: "POST", body: {} }));
  if (command === "projects") return print(await request("/projects"));
  if (command === "next-action") return print(await request("/agent/next-action", { method: "POST", body: { project: getArg("--project", "default"), target: getArg("--target", "bridge-only"), message_count: Number(getArg("--message-count", "0")) } }));
  if (command === "routes") return print(await request("/routes"));
  if (command === "routes-conflicts") {
    const url = getArg("--url", "");
    if (url || getArg("--title", "") || getArg("--project", "")) {
      return print(await request("/routes/conflicts", { method: "POST", body: { page_url: url, title: getArg("--title", ""), project_hint: getArg("--project", "") } }));
    }
    return print(await request("/routes/conflicts"));
  }
  if (command === "routes-visual") {
    const url = getArg("--url", "");
    if (url || getArg("--title", "") || getArg("--project", "")) {
      return print(await request("/routes/visual-map", { method: "POST", body: { page_url: url, title: getArg("--title", ""), project_hint: getArg("--project", "") } }));
    }
    return print(await request("/routes/visual-map"));
  }
  if (command === "routes-fix-suggestions") {
    const url = getArg("--url", "");
    if (url || getArg("--title", "") || getArg("--project", "")) {
      return print(await request("/routes/fix-suggestions", { method: "POST", body: { page_url: url, title: getArg("--title", ""), project_hint: getArg("--project", "") } }));
    }
    return print(await request("/routes/fix-suggestions"));
  }
  if (command === "stress-routes") {
    return print(await request("/stress/routes", { method: "POST", body: { project: getArg("--project", "stress-route"), count: Number(getArg("--count", "100")) } }));
  }
  if (command === "repos") return print(await request("/repos"));
  if (command === "keys") return print(await request("/keys"));
  if (command === "status") return print(await request("/status"));
  if (command === "agent-summary") return print(await request(`/agent/summary?project=${encodeURIComponent(getArg("--project", "default"))}`));
  if (command === "compact-summary") return print(await request(`/agent/compact-summary?project=${encodeURIComponent(getArg("--project", "default"))}`));
  if (command === "queue") return print(await request("/queue/status"));
  if (command === "queue-stats") return print(await request(`/queue/stats?project=${encodeURIComponent(getArg("--project", ""))}`));
  if (command === "events") return print(await request(`/events?limit=${encodeURIComponent(getArg("--limit", "50"))}`));
  if (command === "events-compact") return print(await request("/events/compact", { method: "POST", body: { max_events: Number(getArg("--max-events", "2000")) } }));
  if (command === "rate-limit-status") return print(await request("/rate-limit/status"));
  if (command === "receipts-recent") return print(await request(`/receipts/recent?project=${encodeURIComponent(getArg("--project", ""))}&limit=${encodeURIComponent(getArg("--limit", "20"))}`));
  if (command === "sha-index") return print(await request("/sha-index"));
  if (command === "latest") return print(await request(`/latest?project=${encodeURIComponent(getArg("--project", "default"))}`));
  if (command === "receipt") return print(await request(`/receipt?project=${encodeURIComponent(getArg("--project", "default"))}&round=${encodeURIComponent(getArg("--round", getArg("--round-id", "")))}`));
  if (command === "resolve") {
    return print(await request("/resolve-route", {
      method: "POST",
      body: { page_url: getArg("--url", ""), title: getArg("--title", ""), project_hint: getArg("--project", "") }
    }));
  }
  if (command === "queue-claim") {
    return print(await request("/queue/claim", {
      method: "POST",
      body: { project: getArg("--project", ""), claimed_by: getArg("--agent", "codex") }
    }));
  }

  if (command === "queue-claim-batch") {
    return print(await request("/queue/claim-batch", {
      method: "POST",
      body: { project: getArg("--project", ""), claimed_by: getArg("--agent", "codex"), max: Number(getArg("--max", "5")) }
    }));
  }
  if (command === "queue-release") {
    return print(await request("/queue/release", {
      method: "POST",
      body: { project: getArg("--project", "default"), round_id: getArg("--round", getArg("--round-id", "")), reason: getArg("--reason", "manual_release") }
    }));
  }
  if (command === "queue-reclaim-expired") {
    return print(await request("/queue/reclaim-expired", {
      method: "POST",
      body: { project: getArg("--project", ""), reason: getArg("--reason", "manual_reclaim") }
    }));
  }
  if (command === "queue-retry") {
    return print(await request("/queue/retry", {
      method: "POST",
      body: { project: getArg("--project", "default"), round_id: getArg("--round", getArg("--round-id", "")), reason: getArg("--reason", "manual_retry") }
    }));
  }
  if (command === "auto-continue-plan") {
    return print(await request("/auto-continue/plan", {
      method: "POST",
      body: { project: getArg("--project", "default"), message_count: Number(getArg("--message-count", "0")), roundpack_interval: Number(getArg("--interval", "5")), force_roundpack: hasFlag("--force") }
    }));
  }
  if (command === "enqueue") {
    return print(await request("/queue/enqueue", {
      method: "POST",
      body: {
        project: getArg("--project", "default"),
        round_id: getArg("--round", `${Date.now()}`),
        file_sha256: getArg("--sha", ""),
        action: getArg("--action", "archive_roundpack")
      }
    }));
  }
  if (command === "archive-base64") {
    return print(await request("/archive/base64", {
      method: "POST",
      body: {
        project: getArg("--project", "default"),
        round_id: getArg("--round", `${Date.now()}`),
        file_name: getArg("--file", "webai-roundpack.zip"),
        content_base64: getArg("--content-base64", Buffer.from("dry-run-roundpack", "utf8").toString("base64")),
        repo_alias: getArg("--repo-alias", ""),
        key_alias: getArg("--key-alias", ""),
        title: getArg("--title", "CLI archive-base64"),
        dry_run: hasFlag("--dry-run")
      }
    }));
  }
  if (command === "stress-archive") {
    const project = getArg("--project", "stress");
    const count = Math.max(1, Math.min(500, Number(getArg("--count", "50"))));
    const parallel = Math.max(1, Math.min(50, Number(getArg("--parallel", "10"))));
    const results = [];
    let index = 0;
    async function worker(workerId) {
      while (index < count) {
        const current = index++;
        const content = Buffer.from(`stress-round-${current}-${Date.now()}`, "utf8").toString("base64");
        const result = await request("/archive/base64", {
          method: "POST",
          body: { project, round_id: `stress-${String(current).padStart(4, "0")}`, file_name: `stress-${current}.zip`, content_base64: content, dry_run: true, title: `stress worker ${workerId}` }
        });
        results.push({ round_id: result.round_id, status: result.status, sha256: result.file_sha256 });
      }
    }
    await Promise.all(Array.from({ length: parallel }, (_, i) => worker(i + 1)));
    return print({ ok: true, schema_version: "openpatch.stress_archive.v16", project, count, parallel, results_count: results.length, sample: results.slice(0, 5) });
  }
  throw new Error(`unknown command: ${command}`);
}

function print(value) { console.log(JSON.stringify(value, null, 2)); }

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
