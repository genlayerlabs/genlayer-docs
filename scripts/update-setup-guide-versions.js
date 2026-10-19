#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { publishedVersions } = require('./lib/release-versions');

// A generator that cannot find its source or its target block fails the build.
const fail = (msg) => { console.error(msg); process.exitCode = 1; };

// The tail of the guide's list command: the sed pair makes the version sort
// put v0.6.0-rc.N below v0.6.0; awk drops the rc builds of versions that are
// already stable (the bucket keeps them, the changelog does not list them).
const LIST_COMMAND_TAIL = `| sed 's/-rc/~rc/' | sort -ruV | sed 's/~rc/-rc/' | awk '{c=$0; sub(/-rc\\..*/,"",c)} /-rc\\./{if (c in s) next} !/-rc\\./{s[c]=1} {print}' | head -n 5`;

/**
 * Update the setup guide's version list, list command and `export version=` line.
 * The guide lists the versions the node has changelog files for
 * (scripts/lib/release-versions.js) and names the newest one.
 * @param {{root?: string}} options
 */
function updateSetupGuideVersions({ root = process.cwd() } = {}) {
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
  const versions = publishedVersions(names);
  if (versions.length === 0) {
    fail('No version files found in changelog directory');
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

  // Everything after the sed that extracts the version names.
  const listCommandPattern = /\| (?:sed 's\/-rc\/~rc\/' \| )?sort -ruV?[^\n]*?\| head -n 5/;
  if (listCommandPattern.test(content)) {
    content = content.replace(listCommandPattern, () => LIST_COMMAND_TAIL);
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
  console.log(`Updated setup guide with ${versions.length} published versions, latest: ${latestVersion}`);
}

if (require.main === module) {
  updateSetupGuideVersions();
}

module.exports = { updateSetupGuideVersions, LIST_COMMAND_TAIL };
