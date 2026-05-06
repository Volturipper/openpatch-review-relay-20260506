const bridge = process.env.OPENPATCH_BRIDGE_URL || 'http://127.0.0.1:17878';
const runs = Number(process.env.OPENPATCH_PARALLEL_RUNS || 12);
const payloads = Array.from({ length: runs }, (_, i) => ({
  project: 'webai-transfer',
  round_id: `parallel-${String(i + 1).padStart(2, '0')}`,
  file_name: 'webai-roundpack.zip',
  content_base64: Buffer.from(`parallel-round-${i % 3}`, 'utf8').toString('base64'),
  dry_run: true,
  title: `parallel smoke ${i + 1}`
}));
const started = Date.now();
const responses = await Promise.all(payloads.map(async (body) => {
  const res = await fetch(`${bridge}/archive/base64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return { ok: res.ok && json.ok, status: json.status, round_id: json.round_id, duplicate: Boolean(json.duplicate), sha: json.file_sha256 };
}));
const latest = await (await fetch(`${bridge}/latest?project=webai-transfer`)).json();
const stats = await (await fetch(`${bridge}/queue/stats?project=webai-transfer`)).json();
const receipts = await (await fetch(`${bridge}/receipts/recent?project=webai-transfer&limit=20`)).json();
const result = {
  ok: responses.every((item) => item.ok),
  runs,
  duration_ms: Date.now() - started,
  duplicate_count: responses.filter((item) => item.duplicate).length,
  unique_sha_count: new Set(responses.map((item) => item.sha)).size,
  latest_round: latest.latest_round,
  queue_stats: stats,
  receipt_count: receipts.count,
  sample: responses.slice(0, 5)
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
