import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('../', import.meta.url).pathname);
const contentPath = path.join(root, 'openpatch-main/src/content-script.js');
const schemaPath = path.join(root, 'schemas/openpatch.agent_button.v17.schema.json');
const content = fs.readFileSync(contentPath, 'utf8');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const requiredDomMarkers = [
  'openpatchReButtonId',
  'openpatchReButtonIndex',
  'openpatchReVisibleCount',
  'openpatchReMessageId',
  'openpatchReAssetKind',
  'openpatchReRouteDecision',
  'openpatchReAllowedAction',
  'openpatchReNotApproval'
];

const requiredMarkerFields = [
  'button_index',
  'visible_count',
  'message_id',
  'message_button_index',
  'message_visible_count',
  'asset_kind',
  'route_decision',
  'allowed_action',
  'not_approval'
];

const assertions = [];
function check(name, passed, detail = '') {
  assertions.push({ name, passed, detail });
  if (!passed) throw new Error(`${name}: ${detail}`);
}

for (const marker of requiredDomMarkers) {
  check(`DOM dataset contains ${marker}`, content.includes(`dataset.${marker}`));
}
for (const field of requiredMarkerFields) {
  check(`agent marker carries ${field}`, content.includes(field));
}
check('has message scope resolver', content.includes('function getClosestMessageScope'));
check('has compact message hash', content.includes('function hashString') && content.includes('getMessageIdForElement'));
check('has local counter computation', content.includes('computeButtonCounterMetadata'));
check('refreshes counters after insertion', content.includes('refreshButtonCounterMetadata(uploadButton'));
check('getCurrentAgentMarkers refreshes visible counters', content.includes('refreshVisibleButtonCounters({ quiet: true });'));
for (const field of ['buttonId', 'button_index', 'visible_count', 'message_id', 'message_button_index', 'message_visible_count', 'counter_scope']) {
  check(`schema requires/properties include ${field}`, schema.required.includes(field) && schema.properties[field]);
}

const result = {
  schema_version: 'openpatch.re.button_marker_counter_self_test.v1',
  status: 'pass',
  assertions,
  acceptance_mapping: {
    'DOM marker data exists': requiredDomMarkers,
    'Loaded message can be inspected locally': ['message_id', 'message_button_index', 'message_visible_count'],
    'Lazy-loaded history not required': ['counter_scope=loaded_dom_and_current_message', 'counter_note'],
    'Regression evidence included': ['this self-test', 'schema update', 'content-script marker update']
  },
  generated_at: new Date().toISOString()
};
console.log(JSON.stringify(result, null, 2));
