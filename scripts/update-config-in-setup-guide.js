#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// A generator that cannot find its source or its target block fails the build.
const fail = (msg) => { console.error(msg); process.exitCode = 1; };

// Each network has a "##### Testnet <name>" heading followed by a yaml block.
const NETWORKS = [
  { name: 'Bradbury', file: 'bradbury.yaml' },
  { name: 'Clarke', file: 'clarke.yaml' },
];

/**
 * Update the setup guide with the latest config from content/validators/config.yaml
 * and the network-specific configs from content/validators/<network>.yaml
 */
function updateConfigInSetupGuide() {
  const configPath = path.join(process.cwd(), 'content/validators/config.yaml');
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

  // Update the network config blocks (rollup + consensus)
  for (const { name, file } of NETWORKS) {
    const networkPath = path.join(process.cwd(), 'content/validators', file);
    if (!fs.existsSync(networkPath)) continue;
    const networkContent = fs.readFileSync(networkPath, 'utf8');
    const networkPattern = new RegExp(`(##### Testnet ${name}\\s*\`\`\`yaml[^\\n]*\\n)([\\s\\S]*?)(\\n\`\`\`)`);

    if (networkPattern.test(setupGuideContent)) {
      setupGuideContent = setupGuideContent.replace(
        networkPattern,
        (_, before, _old, after) => before + networkContent + after
      );
      console.log(`Updated ${name} config block at ${new Date().toISOString()}`);
    } else {
      fail(`Could not find ${name} config pattern in setup guide`);
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
