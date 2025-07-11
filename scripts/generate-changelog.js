#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Read all changelog version files and generate the combined content
 */
function generateChangelog() {
  const changelogDir = path.join(process.cwd(), 'content/validators/changelog');
  const targetFile = path.join(process.cwd(), 'pages/validators/changelog.mdx');
  
  if (!fs.existsSync(changelogDir)) {
    console.error(`Changelog directory ${changelogDir} does not exist`);
    return;
  }
  
  // Read all .mdx files from the changelog directory
  const files = fs.readdirSync(changelogDir)
    .filter(file => file.endsWith('.mdx'))
    .sort((a, b) => {
      // Sort versions in descending order (newest first)
      // Handle both v0.x.x and v0.x.x-testnetXXX formats
      const versionA = a.replace('.mdx', '');
      const versionB = b.replace('.mdx', '');
      
      // Extract version parts for comparison
      const parseVersion = (v) => {
        const match = v.match(/v(\d+)\.(\d+)\.(\d+)(?:-testnet(\d+))?/);
        if (!match) return [0, 0, 0, 0];
        return [
          parseInt(match[1]), 
          parseInt(match[2]), 
          parseInt(match[3]), 
          parseInt(match[4] || '999') // Regular versions come before testnet versions
        ];
      };
      
      const [majorA, minorA, patchA, testnetA] = parseVersion(versionA);
      const [majorB, minorB, patchB, testnetB] = parseVersion(versionB);
      
      // Compare versions (descending order)
      if (majorB !== majorA) return majorB - majorA;
      if (minorB !== minorA) return minorB - minorA;
      if (patchB !== patchA) return patchB - patchA;
      return testnetB - testnetA;
    });
  
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