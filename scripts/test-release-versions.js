#!/usr/bin/env node

// Tests the release-version rule (scripts/lib/release-versions.js) and the
// setup guide generator that applies it. Run: npm run test:release-versions

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { publishedVersions, currentLine, mayLeave } = require('./lib/release-versions');
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

const STABLE = ['v0.2.0-testnet005', 'v0.5.8', 'v0.5.9', 'v0.5.12', 'v0.5.13', 'v0.5.14'];

const tests = {
  'stable releases: numeric order, testnet builds hidden from the guide': () => {
    assert.deepStrictEqual(publishedVersions(STABLE), ['v0.5.14', 'v0.5.13', 'v0.5.12', 'v0.5.9', 'v0.5.8']);
    const { guide, failed } = guideFor(STABLE);
    assert.ok(!failed);
    assert.match(guide, /export version=v0\.5\.14 #/);
  },
  'every rc with a changelog file is listed; the newest is named': () => {
    const names = [...STABLE, 'v0.6.0-rc.1', 'v0.6.0-rc.2'];
    assert.deepStrictEqual(publishedVersions(names).slice(0, 3), ['v0.6.0-rc.2', 'v0.6.0-rc.1', 'v0.5.14']);
    const { guide } = guideFor(names);
    assert.match(guide, /export version=v0\.6\.0-rc\.2 #/);
    // The guide lists only the current release line (v0.6.x).
    assert.match(guide, /```sh\n   v0\.6\.0-rc\.2\n   v0\.6\.0-rc\.1\n   ```/);
  },
  'rc.10 is newer than rc.9': () => {
    assert.strictEqual(publishedVersions(['v0.6.0-rc.9', 'v0.6.0-rc.10'])[0], 'v0.6.0-rc.10');
  },
  'a stable release sorts above its own rcs and becomes the named version': () => {
    const names = [...STABLE, 'v0.6.0-rc.1', 'v0.6.0-rc.2', 'v0.6.0'];
    assert.deepStrictEqual(publishedVersions(names).slice(0, 3), ['v0.6.0', 'v0.6.0-rc.2', 'v0.6.0-rc.1']);
    assert.match(guideFor(names).guide, /export version=v0\.6\.0 #/);
  },
  'the guide lists the current release line only': () => {
    assert.deepStrictEqual(currentLine(publishedVersions([...STABLE, 'v0.6.0-rc.1', 'v0.6.0'])), ['v0.6.0', 'v0.6.0-rc.1']);
    assert.deepStrictEqual(currentLine(publishedVersions(STABLE)), ['v0.5.14', 'v0.5.13', 'v0.5.12', 'v0.5.9', 'v0.5.8']);
    assert.deepStrictEqual(currentLine(publishedVersions(['v0.6.1', 'v0.7.0-rc.1'])), ['v0.7.0-rc.1']);
    assert.deepStrictEqual(currentLine([]), []);
  },
  'the node removes rc files, the docs follow': () => {
    assert.deepStrictEqual(publishedVersions([...STABLE, 'v0.6.0']).slice(0, 2), ['v0.6.0', 'v0.5.14']);
  },
  'an rc of the next version shows above the current stable': () => {
    assert.deepStrictEqual(publishedVersions(['v0.6.0', 'v0.6.1-rc.1']), ['v0.6.1-rc.1', 'v0.6.0']);
  },
  'the changelog page lists the same versions plus testnet builds': () => {
    const names = [...STABLE, 'v0.6.0-rc.1', 'v0.6.0-rc.2'];
    const page = publishedVersions(names, { testnet: true });
    assert.deepStrictEqual(page.filter((v) => !v.includes('testnet')), publishedVersions(names));
    assert.strictEqual(page[page.length - 1], 'v0.2.0-testnet005');
  },
  'sync check: an rc file may leave, a stable one never': () => {
    assert.ok(mayLeave('v0.6.0-rc.1'));
    assert.ok(!mayLeave('v0.5.14'));
    assert.ok(!mayLeave('v0.2.0-testnet005'));
  },
  'the list command keeps the current line, drops rc builds of stable versions': () => {
    const guide = guideFor(STABLE).guide;
    assert.ok(guide.includes(LIST_COMMAND_TAIL));
    assert.doesNotMatch(guide, /grep -v "rc"/);
    const tail = LIST_COMMAND_TAIL.replace(/^\| /, '');
    const run = (list) => execFileSync('sh', ['-c', `printf '${list.join('\\n')}\\n' | ${tail}`], { encoding: 'utf8' }).trim().split('\n');
    // The shell command lists what the guide lists.
    const same = (names) => assert.deepStrictEqual(run(names), currentLine(publishedVersions(names)));
    // Bucket during the rc: v0.6.x only; rc builds of stable versions dropped.
    assert.deepStrictEqual(run(['v0.5.9', 'v0.5.14-rc.1', 'v0.5.14', 'v0.6.0-rc.1', 'v0.6.0-rc.2']), ['v0.6.0-rc.2', 'v0.6.0-rc.1']);
    // After v0.6.0 (node removed the rc files): v0.6.x stable only.
    same(['v0.5.14', 'v0.6.0']);
    assert.deepStrictEqual(run(['v0.5.14', 'v0.6.0-rc.1', 'v0.6.0-rc.2', 'v0.6.0']), ['v0.6.0']);
    // Only v0.5: the v0.5 line.
    same(['v0.5.9', 'v0.5.12', 'v0.5.14']);
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
