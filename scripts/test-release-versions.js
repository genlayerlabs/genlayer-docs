#!/usr/bin/env node

// Tests the release-version rule (scripts/lib/release-versions.js) and the
// setup guide generator that applies it. Run: npm run test:release-versions

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { publishedVersions, isSuperseded } = require('./lib/release-versions');
const { updateSetupGuideVersions, LIST_COMMAND_TAIL } = require('./update-setup-guide-versions');

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

function guideFor(changelog, guide = GUIDE) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'release-versions-'));
  fs.mkdirSync(path.join(root, 'content/validators/changelog'), { recursive: true });
  fs.mkdirSync(path.join(root, 'pages/validators'), { recursive: true });
  for (const v of changelog) fs.writeFileSync(path.join(root, 'content/validators/changelog', `${v}.mdx`), '');
  const guidePath = path.join(root, 'pages/validators/setup-guide.mdx');
  fs.writeFileSync(guidePath, guide);
  const before = process.exitCode;
  updateSetupGuideVersions({ root });
  const failed = process.exitCode === 1 && before !== 1;
  process.exitCode = before;
  const out = fs.readFileSync(guidePath, 'utf8');
  fs.rmSync(root, { recursive: true, force: true });
  return { guide: out, failed };
}

const STABLE = ['v0.2.0-testnet005', 'v0.5.8-rc.4', 'v0.5.8', 'v0.5.9', 'v0.5.12', 'v0.5.13', 'v0.5.14'];

const tests = {
  'only stable releases: newest stable, numeric order, old rcs and testnets hidden': () => {
    assert.deepStrictEqual(publishedVersions(STABLE), ['v0.5.14', 'v0.5.13', 'v0.5.12', 'v0.5.9', 'v0.5.8']);
    const { guide, failed } = guideFor(STABLE);
    assert.ok(!failed);
    assert.match(guide, /export version=v0\.5\.14 #/);
  },
  'during an rc: the newest rc is the current release, older rcs hidden': () => {
    const names = [...STABLE, 'v0.6.0-rc.1', 'v0.6.0-rc.2'];
    assert.deepStrictEqual(publishedVersions(names).slice(0, 3), ['v0.6.0-rc.2', 'v0.5.14', 'v0.5.13']);
    const { guide } = guideFor(names);
    assert.match(guide, /export version=v0\.6\.0-rc\.2 #/);
    assert.match(guide, /```sh\n   v0\.6\.0-rc\.2\n   v0\.5\.14\n   v0\.5\.13\n   v0\.5\.12\n   v0\.5\.9\n   ```/);
  },
  'rc.10 is newer than rc.9': () => {
    assert.strictEqual(publishedVersions(['v0.6.0-rc.9', 'v0.6.0-rc.10'])[0], 'v0.6.0-rc.10');
  },
  'after the stable release: every rc of that version disappears': () => {
    const names = [...STABLE, 'v0.6.0-rc.1', 'v0.6.0-rc.2', 'v0.6.0'];
    const published = publishedVersions(names);
    assert.strictEqual(published[0], 'v0.6.0');
    assert.ok(!published.some((v) => v.startsWith('v0.6.0-rc')));
    assert.match(guideFor(names).guide, /export version=v0\.6\.0 #/);
  },
  'an rc of the next version shows above the current stable': () => {
    const names = ['v0.6.0', 'v0.6.1-rc.1'];
    assert.deepStrictEqual(publishedVersions(names), ['v0.6.1-rc.1', 'v0.6.0']);
  },
  'the changelog page keeps testnet builds and every rc of an unreleased version': () => {
    const opts = { testnet: true, allRcs: true };
    assert.deepStrictEqual(publishedVersions(['v0.2.0-testnet005', 'v0.5.8-rc.4', 'v0.5.8'], opts), ['v0.5.8', 'v0.2.0-testnet005']);
    assert.deepStrictEqual(publishedVersions(['v0.5.14', 'v0.6.0-rc.1', 'v0.6.0-rc.2'], opts), ['v0.6.0-rc.2', 'v0.6.0-rc.1', 'v0.5.14']);
    assert.deepStrictEqual(publishedVersions(['v0.5.14', 'v0.6.0-rc.1', 'v0.6.0-rc.2', 'v0.6.0'], opts), ['v0.6.0', 'v0.5.14']);
  },
  'superseded: an rc may leave once its stable exists, a stable never': () => {
    assert.ok(!isSuperseded('v0.6.0-rc.1', ['v0.6.0-rc.2']));
    assert.ok(isSuperseded('v0.6.0-rc.2', ['v0.6.0']));
    assert.ok(!isSuperseded('v0.6.0-rc.2', ['v0.6.0-rc.1', 'v0.5.14']));
    assert.ok(!isSuperseded('v0.5.14', ['v0.6.0']));
  },
  'the list command applies the same rule in shell': () => {
    const guide = guideFor(STABLE).guide;
    assert.ok(guide.includes(LIST_COMMAND_TAIL));
    assert.doesNotMatch(guide, /grep -v "rc"/);
    const tail = LIST_COMMAND_TAIL.replace(/^\| /, '');
    const run = (list) => execFileSync('sh', ['-c', `printf '${list.join('\\n')}\\n' | ${tail}`], { encoding: 'utf8' }).trim().split('\n');
    // The shell command applies the same rule as publishedVersions.
    const during = ['v0.5.9', 'v0.5.14-rc.1', 'v0.5.14', 'v0.6.0-rc.1', 'v0.6.0-rc.2'];
    assert.deepStrictEqual(run(during), publishedVersions(during));
    const after = [...during, 'v0.6.0', 'v0.6.1-rc.1'];
    assert.deepStrictEqual(run(after), publishedVersions(after));
    assert.deepStrictEqual(run(after), ['v0.6.1-rc.1', 'v0.6.0', 'v0.5.14', 'v0.5.9']);
  },
  'the generator is idempotent': () => {
    const once = guideFor([...STABLE, 'v0.6.0-rc.2']).guide;
    assert.strictEqual(guideFor([...STABLE, 'v0.6.0-rc.2'], once).guide, once);
  },
  'no versions fails the generator': () => {
    assert.ok(guideFor([]).failed);
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
