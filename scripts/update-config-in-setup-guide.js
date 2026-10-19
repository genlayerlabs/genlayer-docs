#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// A generator that cannot find its source or its target block fails the build.
const fail = (msg) => { console.error(msg); process.exitCode = 1; };

/**
 * Update the setup guide with the latest config from content/validators/config.yaml
 * and the network-specific config from content/validators/bradbury.yaml
 */
function updateConfigInSetupGuide() {
  const configPath = path.join(process.cwd(), 'content/validators/config.yaml');
  const bradburyPath = path.join(process.cwd(), 'content/validators/bradbury.yaml');
  const setupGuidePath = path.join(process.cwd(), 'pages/validators/setup-guide.mdx');

  if (!fs.existsSync(setupGuidePath)) {
    fail(`Setup guide file ${setupGuidePath} does not exist`);
    return;
  }

  let setupGuideContent = fs.readFileSync(setupGuidePath, 'utf8');

  // Update main config block from config.yaml
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const configPattern = /(You can use the following example configuration[\s\S]*?```yaml[^\n]*\n)([\s\S]*?)(\n```)/;

    if (configPattern.test(setupGuideContent)) {
      setupGuideContent = setupGuideContent.replace(
        configPattern,
        (_, before, _old, after) => before + configContent + after
      );
      console.log(`Updated main config block at ${new Date().toISOString()}`);
    } else {
      fail('Could not find main config pattern in setup guide');
    }
  }

  // Update Bradbury network config (rollup + consensus)
  if (fs.existsSync(bradburyPath)) {
    const bradburyContent = fs.readFileSync(bradburyPath, 'utf8');
    const bradburyPattern = /(##### Testnet Bradbury\s*```yaml[^\n]*\n)([\s\S]*?)(\n```)/;

    if (bradburyPattern.test(setupGuideContent)) {
      setupGuideContent = setupGuideContent.replace(
        bradburyPattern,
        (_, before, _old, after) => before + bradburyContent + after
      );
      console.log(`Updated Bradbury config block at ${new Date().toISOString()}`);
    } else {
      fail('Could not find Bradbury config pattern in setup guide');
    }
  }

  // Write the updated content back
  fs.writeFileSync(setupGuidePath, setupGuideContent);
}

// Run the script
if (require.main === module) {
  updateConfigInSetupGuide();
}

module.exports = { updateConfigInSetupGuide };
