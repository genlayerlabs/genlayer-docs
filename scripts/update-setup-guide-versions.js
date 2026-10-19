#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// A generator that cannot find its source or its target block fails the build.
const fail = (msg) => { console.error(msg); process.exitCode = 1; };

const CHANNELS = ['stable', 'all'];

// v0.6.0, v0.6.0-rc.2, v0.2.0-testnet005
const VERSION_RE = /^v(\d+)\.(\d+)\.(\d+)(?:-(rc)\.(\d+)|-(testnet)(\d+))?$/;

function parseVersion(v) {
  const m = v.match(VERSION_RE);
  if (!m) return null;
  const pre = m[4] || m[6] || null;
  return {
    name: v,
    core: [Number(m[1]), Number(m[2]), Number(m[3])],
    pre, // null for a stable release
    preNumber: Number(m[5] || m[7] || 0),
  };
}

// Newest first. A stable release sorts above its own pre-releases.
function compareDesc(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a.core[i] !== b.core[i]) return b.core[i] - a.core[i];
  }
  if (!a.pre !== !b.pre) return a.pre ? 1 : -1;
  return b.preNumber - a.preNumber;
}

/**
 * Select the versions the guide names for a channel.
 * Testnet builds (v0.2.0-testnetNNN) are never named. Release candidates are
 * named only on the 'all' channel.
 */
function selectVersions(names, channel) {
  if (!CHANNELS.includes(channel)) {
    throw new Error(`versionChannel must be one of ${CHANNELS.join(', ')}, got ${JSON.stringify(channel)}`);
  }
  return names
    .map(parseVersion)
    .filter(Boolean)
    .filter((v) => v.pre !== 'testnet' && (channel === 'all' || v.pre === null))
    .sort(compareDesc)
    .map((v) => v.name);
}

/** The list command shown in the guide, as the channel would run it. */
function listCommandTail(channel) {
  return channel === 'all' ? '| sort -ruV | head -n 5' : '| sort -ruV | grep -v "rc" | head -n 5';
}

/**
 * Update the setup guide's version list, list command and `export version=` line.
 * @param {{root?: string, channel?: string}} options
 */
function updateSetupGuideVersions({ root = process.cwd(), channel } = {}) {
  if (channel === undefined) {
    channel = require('./setup-guide-versions.config').versionChannel;
  }
  const changelogDir = path.join(root, 'content/validators/changelog');
  const setupGuidePath = path.join(root, 'pages/validators/setup-guide.mdx');

  if (!fs.existsSync(changelogDir)) {
    fail(`Changelog directory ${changelogDir} does not exist`);
    return;
  }
  if (!fs.existsSync(setupGuidePath)) {
    fail(`Setup guide file ${setupGuidePath} does not exist`);
    return;
  }

  const names = fs.readdirSync(changelogDir)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''));

  let versions;
  try {
    versions = selectVersions(names, channel);
  } catch (e) {
    fail(e.message);
    return;
  }
  if (versions.length === 0) {
    fail(`No ${channel} version files found in changelog directory`);
    return;
  }

  const latestVersion = versions[0];
  let content = fs.readFileSync(setupGuidePath, 'utf8');

  // The version list between "You should see a list like this" and "Typically you will want".
  const versionListPattern = /(You should see a list like this\s*\n\s*```sh\n)([\s\S]*?)(\n\s*```\s*\n\s*Typically,? you will want)/;
  const versionList = versions.slice(0, 5).map((v) => `   ${v}`).join('\n');
  if (versionListPattern.test(content)) {
    content = content.replace(versionListPattern, (_, before, _old, after) => before + versionList + after);
  } else {
    fail('Could not find version list pattern in setup guide');
  }

  // The tail of the list command: version sort, rc filter (stable only), first 5.
  const listCommandPattern = /\| sort -ruV?(?: \| grep -v "rc")? \| head -n 5/;
  if (listCommandPattern.test(content)) {
    content = content.replace(listCommandPattern, () => listCommandTail(channel));
  } else {
    fail('Could not find the version list command (| sort -ru... | head -n 5) in setup guide');
  }

  const exportPattern = /export version=v\d+\.\d+\.\d+(?:-rc\.\d+|-testnet\d+)?/;
  if (exportPattern.test(content)) {
    content = content.replace(exportPattern, () => `export version=${latestVersion}`);
  } else {
    fail('Could not find export version pattern in setup guide');
  }

  fs.writeFileSync(setupGuidePath, content);
  console.log(`Updated setup guide (${channel} channel) with ${versions.length} versions, latest: ${latestVersion}`);
}

if (require.main === module) {
  updateSetupGuideVersions();
}

module.exports = { updateSetupGuideVersions, selectVersions, listCommandTail, CHANNELS };
