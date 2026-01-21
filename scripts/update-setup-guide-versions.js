#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update the setup guide with the latest versions from changelog
 */
function updateSetupGuideVersions() {
  const changelogDir = path.join(process.cwd(), 'content/validators/changelog');
  const setupGuidePath = path.join(process.cwd(), 'pages/validators/setup-guide.mdx');
  
  if (!fs.existsSync(changelogDir)) {
    console.error(`Changelog directory ${changelogDir} does not exist`);
    return;
  }
  
  // Read all version files from the changelog directory
  const versions = fs.readdirSync(changelogDir)
    .filter(file => file.endsWith('.mdx'))
    .map(file => file.replace('.mdx', ''))
    .sort((a, b) => {
      // Sort versions in descending order (newest first)
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
      
      const [majorA, minorA, patchA, testnetA] = parseVersion(a);
      const [majorB, minorB, patchB, testnetB] = parseVersion(b);
      
      if (majorB !== majorA) return majorB - majorA;
      if (minorB !== minorA) return minorB - minorA;
      if (patchB !== patchA) return patchB - patchA;
      return testnetB - testnetA;
    });
  
  if (versions.length === 0) {
    console.error('No version files found in changelog directory');
    return;
  }
  
  // Get the latest version
  const latestVersion = versions[0];
  
  // Check that the setup guide file exists
  if (!fs.existsSync(setupGuidePath)) {
    console.error(`Setup guide file ${setupGuidePath} does not exist`);
    return;
  }
  
  // Read the setup guide
  let setupGuideContent = fs.readFileSync(setupGuidePath, 'utf8');
  
  // Update the version list with abbreviated format
  // Show all current minor version, then first 3 and last 3 of previous minor version with "..." in between

  // Parse version to get major.minor
  const parseMinorVersion = (v) => {
    const match = v.match(/v(\d+)\.(\d+)\.\d+/);
    if (!match) return null;
    return `${match[1]}.${match[2]}`;
  };

  // Filter out testnet versions for the display list
  const releaseVersions = versions.filter(v => !v.includes('testnet'));

  // Get the current minor version (from latest version)
  const currentMinor = parseMinorVersion(latestVersion);

  // Get all versions from current minor version
  const currentMinorVersions = releaseVersions.filter(v => parseMinorVersion(v) === currentMinor);

  // Get the previous minor version
  const previousMinorVersions = releaseVersions.filter(v => {
    const minor = parseMinorVersion(v);
    return minor && minor !== currentMinor;
  });

  // Build the abbreviated list
  const versionListItems = [
    ...currentMinorVersions.map(v => `      ${v}`)
  ];

  if (previousMinorVersions.length > 0) {
    const first3 = previousMinorVersions.slice(0, 3);
    const last3 = previousMinorVersions.slice(-3);

    // Add first 3 of previous minor
    versionListItems.push(...first3.map(v => `      ${v}`));

    // Add "..." if there are versions in between
    if (previousMinorVersions.length > 6) {
      versionListItems.push('      ...');
    }

    // Add last 3 of previous minor (avoid duplicates if list is small)
    const last3Unique = last3.filter(v => !first3.includes(v));
    versionListItems.push(...last3Unique.map(v => `      ${v}`));

    // Add trailing "..." to indicate older versions exist
    versionListItems.push('      ...');
  }

  const versionListIndented = versionListItems.join('\n');

  // Replace the version list (between "You should see a list like this" and "Typically you will want")
  const versionListPattern = /(You should see a list like this\s*\n\s*```sh\n)([\s\S]*?)(\n\s*```\s*\n\s*Typically,? you will want)/;

  if (versionListPattern.test(setupGuideContent)) {
    setupGuideContent = setupGuideContent.replace(
      versionListPattern,
      `$1${versionListIndented}$3`
    );
  } else {
    console.warn('Could not find version list pattern in setup guide');
  }
  
  // Update the export version line
  const exportPattern = /export version=v[\d.]+(?:-testnet\d+)?/;
  
  if (exportPattern.test(setupGuideContent)) {
    setupGuideContent = setupGuideContent.replace(
      exportPattern,
      `export version=${latestVersion}`
    );
  } else {
    console.warn('Could not find export version pattern in setup guide');
  }
  
  // Write the updated content back
  fs.writeFileSync(setupGuidePath, setupGuideContent);
  console.log(`Updated setup guide with ${versions.length} versions, latest: ${latestVersion}`);
}

// Run the script
if (require.main === module) {
  updateSetupGuideVersions();
}

module.exports = { updateSetupGuideVersions };