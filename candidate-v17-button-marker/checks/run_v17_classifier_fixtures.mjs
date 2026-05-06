import fs from 'node:fs';
import { classifyOpenPatchAsset } from '../openpatch-main/src/utils.js';
const fixtures = JSON.parse(fs.readFileSync(new URL('./V17_REGRESSION_FIXTURES.json', import.meta.url), 'utf8')).fixtures.filter((x) => x.file_name);
const results = fixtures.map((fixture) => {
  const result = classifyOpenPatchAsset({ fileName: fixture.file_name });
  return {
    fixture: fixture.name,
    file_name: fixture.file_name,
    expected_asset_kind: fixture.expected_asset_kind,
    actual_asset_kind: result.asset_kind,
    expected_route_decision: fixture.expected_route_decision,
    actual_route_decision: result.route_decision,
    pass: result.asset_kind === fixture.expected_asset_kind && result.route_decision === fixture.expected_route_decision
  };
});
const out = { schema_version: 'openpatch.v17_classifier_fixture_results.v1', pass: results.every((x) => x.pass), results };
console.log(JSON.stringify(out, null, 2));
if (!out.pass) process.exit(1);
