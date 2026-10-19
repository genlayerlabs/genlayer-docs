#!/usr/bin/env node

// Tests scripts/update-setup-guide-versions.js on both values of versionChannel
// (scripts/setup-guide-versions.config.js). Run: npm run test:setup-guide-versions

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { updateSetupGuideVersions, selectVersions } = require('./update-setup-guide-versions');
const config = require('./setup-guide-versions.config');

const CHANGELOG = [
  'v0.2.0-testnet005', 'v0.5.9', 'v0.5.12', 'v0.5.13', 'v0.5.14',
  'v0.6.0-rc.1', 'v0.6.0-rc.2', 'v0.5.8-rc.4',
];

const GUIDE = `1. list

   \`\`\`sh copy
   curl -s "https://example" | sed -n 's/x/y/p' | sort -ru | grep -v "rc" | head -n 5
   \`\`\`

   You should see a list like this

   \`\`\`sh
   v0.0.1
   \`\`\`

   Typically, you will want to run the latest version

2. Download
   \`\`\`sh copy
   export version=v0.0.1 # set your desired version here
   \`\`\`
`;

function run(channel, changelog = CHANGELOG) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-guide-versions-'));
  fs.mkdirSync(path.join(root, 'content/validators/changelog'), { recursive: true });
  fs.mkdirSync(path.join(root, 'pages/validators'), { recursive: true });
  for (const v of changelog) fs.writeFileSync(path.join(root, 'content/validators/changelog', `${v}.mdx`), '');
  const guidePath = path.join(root, 'pages/validators/setup-guide.mdx');
  fs.writeFileSync(guidePath, GUIDE);
  const exitCode = process.exitCode;
  updateSetupGuideVersions({ root, channel });
  const failed = process.exitCode === 1 && exitCode !== 1;
  process.exitCode = exitCode;
  const guide = fs.readFileSync(guidePath, 'utf8');
  fs.rmSync(root, { recursive: true, force: true });
  return { guide, failed };
}

const tests = {
  'committed default is stable': () => {
    assert.strictEqual(config.versionChannel, 'stable');
  },
  'stable: newest stable release, numeric order, no rc or testnet': () => {
    assert.deepStrictEqual(selectVersions(CHANGELOG, 'stable'), ['v0.5.14', 'v0.5.13', 'v0.5.12', 'v0.5.9']);
    const { guide, failed } = run('stable');
    assert.ok(!failed);
    assert.match(guide, /export version=v0\.5\.14 #/);
    assert.match(guide, /```sh\n   v0\.5\.14\n   v0\.5\.13\n   v0\.5\.12\n   v0\.5\.9\n   ```/);
    assert.match(guide, /\| sort -ruV \| grep -v "rc" \| head -n 5/);
  },
  'all: newest version including rc, rc.2 above rc.1': () => {
    assert.deepStrictEqual(selectVersions(CHANGELOG, 'all').slice(0, 3), ['v0.6.0-rc.2', 'v0.6.0-rc.1', 'v0.5.14']);
    const { guide, failed } = run('all');
    assert.ok(!failed);
    assert.match(guide, /export version=v0\.6\.0-rc\.2 #/);
    assert.match(guide, /```sh\n   v0\.6\.0-rc\.2\n   v0\.6\.0-rc\.1\n   v0\.5\.14\n   v0\.5\.13\n   v0\.5\.12\n   ```/);
    assert.match(guide, /\| sort -ruV \| head -n 5/);
    assert.doesNotMatch(guide, /grep -v "rc"/);
  },
  'all: a stable release sorts above its own rcs': () => {
    assert.deepStrictEqual(selectVersions([...CHANGELOG, 'v0.6.0'], 'all').slice(0, 3), ['v0.6.0', 'v0.6.0-rc.2', 'v0.6.0-rc.1']);
  },
  'switching all -> stable restores the stable guide': () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-guide-versions-'));
    fs.mkdirSync(path.join(root, 'content/validators/changelog'), { recursive: true });
    fs.mkdirSync(path.join(root, 'pages/validators'), { recursive: true });
    for (const v of CHANGELOG) fs.writeFileSync(path.join(root, 'content/validators/changelog', `${v}.mdx`), '');
    const guidePath = path.join(root, 'pages/validators/setup-guide.mdx');
    fs.writeFileSync(guidePath, GUIDE);
    updateSetupGuideVersions({ root, channel: 'all' });
    updateSetupGuideVersions({ root, channel: 'stable' });
    const guide = fs.readFileSync(guidePath, 'utf8');
    fs.rmSync(root, { recursive: true, force: true });
    assert.match(guide, /export version=v0\.5\.14 #/);
    assert.match(guide, /\| sort -ruV \| grep -v "rc" \| head -n 5/);
  },
  'an unknown channel fails the generator': () => {
    assert.throws(() => selectVersions(CHANGELOG, 'beta'), /versionChannel must be one of stable, all/);
    assert.ok(run('beta').failed);
  },
  'stable with only release candidates fails the generator': () => {
    assert.ok(run('stable', ['v0.6.0-rc.1']).failed);
  },
};

let failures = 0;
for (const [name, fn] of Object.entries(tests)) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failures++;
    console.error(`not ok - ${name}\n  ${e.message}`);
  }
}
process.exitCode = failures ? 1 : 0;
