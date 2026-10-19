#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { publishedVersions, parseVersion } = require('./lib/release-versions');

// A generator that cannot find its source or its target block fails the build.
const fail = (msg) => { console.error(msg); process.exitCode = 1; };

/**
 * Read all changelog version files and generate the combined content
 */
function generateChangelog() {
  const changelogDir = path.join(process.cwd(), 'content/validators/changelog');
  const targetFile = path.join(process.cwd(), 'pages/validators/changelog.mdx');
  
  if (!fs.existsSync(changelogDir)) {
    fail(`Changelog directory ${changelogDir} does not exist`);
    return;
  }
  
  // The versions the docs publish, newest first (scripts/lib/release-versions.js):
  // every changelog file the node has, rcs included.
  const names = fs.readdirSync(changelogDir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => file.replace(/\.mdx$/, ''));
  const files = publishedVersions(names, { testnet: true }).map(v => `${v}.mdx`);
  const unknown = names.filter(n => !files.includes(`${n}.mdx`) && !parseVersion(n));
  if (unknown.length) fail(`Changelog files with an unknown version name: ${unknown.join(', ')}`);

  // Read the content of each file
  const sections = [];
  for (const file of files) {
    const filePath = path.join(changelogDir, file);
    const content = fs.readFileSync(filePath, 'utf8').trim();
    sections.push(content);
  }
  
  // Generate the final changelog content with a timestamp comment
  const changelogContent = `# Changelog

${sections.join('\n\n')}`;
  
  // Write to the target file
  fs.writeFileSync(targetFile, changelogContent);
  console.log(`Generated changelog with ${files.length} versions at ${new Date().toISOString()}`);
}

// Run the script
if (require.main === module) {
  generateChangelog();
}

module.exports = { generateChangelog };