#!/usr/bin/env node

// Checks that the files synced from genlayer-node reach the pages unchanged and
// that the sync kept its rules. Runs in CI on every PR (check-node-docs-sync.yml),
// at the end of scripts/simulate-node-sync.sh, and in the sync workflow.
//
// What it checks:
// - every synced target exists;
// - every generated page block contains its source file verbatim (catches
//   generators that drop, duplicate or rewrite content, e.g. `$$` -> `$`);
// - sanitized files are sanitized (no live RPC URLs, no alloy service);
// - the Bradbury manifest is valid JSON and matches bradbury.yaml;
// - no Asimov references in validator and node API pages;
// - no changelog version disappears compared with BASE_REF (default origin/main),
//   except a release candidate: the node removes rc changelog files on purpose.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { extractAlloyBlock } = require('./update-alloy-in-monitoring');
const { mayLeave } = require('./lib/release-versions');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const failures = [];
const fail = (msg) => failures.push(msg);

// 1. Every sync target exists.
const types = execFileSync('bash', ['.github/scripts/node-sync-params.sh', '--list'], { cwd: root, encoding: 'utf8' })
  .trim().split('\n');
for (const type of types) {
  const out = execFileSync('bash', ['.github/scripts/node-sync-params.sh', type], { cwd: root, encoding: 'utf8' });
  const target = out.match(/^target_path=(.*)$/m)[1];
  if (!exists(target)) fail(`${type}: synced target ${target} is missing`);
}

// The workflow must take its matrix and sparse checkout from node-sync-params.sh.
const workflow = read('.github/workflows/sync-docs-from-node.yml');
if (!/sync_type: \$\{\{ fromJSON\(needs\.prepare\.outputs\.sync_types\) \}\}/.test(workflow)) {
  fail('sync-docs-from-node.yml: the matrix must come from node-sync-params.sh (needs.prepare.outputs.sync_types)');
}
if (!workflow.includes('sparse-checkout: ${{ steps.sync_list.outputs.sources }}')) {
  fail('sync-docs-from-node.yml: the sparse checkout must come from node-sync-params.sh --sources');
}

// 2. Generated blocks hold their source verbatim.
const blockAfter = (page, anchor, lang) => {
  const content = read(page);
  const i = content.indexOf(anchor);
  if (i < 0) return null;
  const open = content.indexOf('```' + lang, i);
  if (open < 0) return null;
  const start = content.indexOf('\n', open) + 1;
  const end = content.indexOf('\n```', start);
  return content.slice(start, end);
};
const sameBlock = (label, page, anchor, lang, expected) => {
  const block = blockAfter(page, anchor, lang);
  if (block === null) {
    fail(`${label}: no \`\`\`${lang} block after "${anchor}" in ${page}`);
  } else if (block.trimEnd() !== expected.trimEnd()) {
    const a = block.split('\n');
    const b = expected.trimEnd().split('\n');
    const line = a.findIndex((l, n) => l !== b[n]);
    fail(`${label}: ${page} differs from its source at block line ${line + 1}:\n    page:   ${JSON.stringify(a[line])}\n    source: ${JSON.stringify(b[line])}`);
  }
};

const setup = 'pages/validators/setup-guide.mdx';
const monitoring = 'pages/validators/monitoring.mdx';
sameBlock('config', setup, 'You can use the following example configuration', 'yaml', read('content/validators/config.yaml'));
sameBlock('config_bradbury', setup, '##### Testnet Bradbury', 'yaml', read('content/validators/bradbury.yaml'));
sameBlock('docker_compose', setup, 'Create a `docker-compose.yaml` file with the following content:', 'yaml', read('content/validators/docker-compose.yaml'));
sameBlock('env_example', setup, 'Set the required environment variables in a `.env` file:', 'env', read('content/validators/env.example'));
sameBlock('alloy_config', monitoring, 'Create or update ./alloy-config.river', 'river', read('content/validators/alloy-config.river'));
const alloyBlock = extractAlloyBlock(read('content/validators/docker-compose-monitoring.yaml'));
if (!alloyBlock) fail('docker_compose_monitoring: no alloy service in content/validators/docker-compose-monitoring.yaml');
else sameBlock('docker_compose_monitoring', monitoring, 'Add or verify the Alloy service in docker-compose.yaml', 'yaml', alloyBlock);

const { GENERATED_NOTE } = require('./update-greybox-in-genvm-config');
if (!exists('pages/validators/greybox-setup.mdx') ||
    read('pages/validators/greybox-setup.mdx') !== `${GENERATED_NOTE}${read('content/validators/greybox-setup-guide.md').trimEnd()}\n`) {
  fail('greybox_setup: pages/validators/greybox-setup.mdx is not the synced greybox-setup-guide.md (run npm run node-update-greybox)');
}

// 3. Sanitized files.
const config = read('content/validators/config.yaml');
for (const key of ['genlayerchainrpcurl', 'genlayerchainwebsocketurl', 'provider']) {
  const m = config.match(new RegExp(`^  ${key}: "([^"]*)"`, 'm'));
  if (!m || !m[1].startsWith('TODO')) fail(`config: rollup.${key} must be a TODO placeholder, found ${m ? m[1] : 'nothing'}`);
}
if (/^  alloy:/m.test(read('content/validators/docker-compose.yaml'))) {
  fail('docker_compose: the alloy service must be removed (sanitize-docker-compose.sh)');
}

// 4. Manifest matches the Bradbury block.
try {
  const manifest = JSON.parse(read('content/validators/bradbury.protocol-manifest.json'));
  const bradbury = read('content/validators/bradbury.yaml');
  const address = (bradbury.match(/consensusaddress: "([^"]+)"/) || [])[1];
  const chainid = (bradbury.match(/chainid: "([^"]+)"/) || [])[1];
  if (!address || manifest.registry.toLowerCase() !== address.toLowerCase()) {
    fail(`manifest: registry ${manifest.registry} does not match bradbury.yaml consensusaddress ${address}`);
  }
  if (!chainid || String(manifest.chainId) !== chainid) {
    fail(`manifest: chainId ${manifest.chainId} does not match bradbury.yaml chainid ${chainid}`);
  }
} catch (e) {
  fail(`manifest: content/validators/bradbury.protocol-manifest.json is not valid JSON (${e.message})`);
}

// 5. Asimov is retired.
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
for (const dir of ['content/validators', 'pages/validators', 'pages/api-references/genlayer-node']) {
  for (const file of walk(dir)) {
    if (/asimov/i.test(read(file))) fail(`asimov: ${file} mentions Asimov`);
  }
}

// 6. No changelog version disappears.
const baseRef = process.env.BASE_REF || 'origin/main';
try {
  const before = execFileSync('git', ['ls-tree', '--name-only', `${baseRef}:content/validators/changelog`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .trim().split('\n').filter(Boolean);
  const now = fs.readdirSync(path.join(root, 'content/validators/changelog'))
    .filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''));
  for (const file of before) {
    if (!exists(`content/validators/changelog/${file}`) && !mayLeave(file.replace(/\.mdx$/, ''))) {
      fail(`changelog: ${file} is on ${baseRef} but was removed (is it missing in the node source?)`);
    }
  }
} catch {
  console.warn(`check-node-sync: ${baseRef} not available, changelog check skipped`);
}

if (failures.length) {
  console.error(`check-node-sync: ${failures.length} problem(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`check-node-sync: OK (${types.length} sync types, 7 generated blocks verbatim)`);
