#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update the setup guide with the latest config from content/validators/config.yaml
 * and network-specific consensus configs from content/validators/asimov.yaml and bradbury.yaml
 */
function updateConfigInSetupGuide() {
  const configPath = path.join(process.cwd(), 'content/validators/config.yaml');
  const asimovPath = path.join(process.cwd(), 'content/validators/asimov.yaml');
  const bradburyPath = path.join(process.cwd(), 'content/validators/bradbury.yaml');
  const setupGuidePath = path.join(process.cwd(), 'pages/validators/setup-guide.mdx');

  if (!fs.existsSync(setupGuidePath)) {
    console.error(`Setup guide file ${setupGuidePath} does not exist`);
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
        `$1${configContent}$3`
      );
      console.log(`Updated main config block at ${new Date().toISOString()}`);
    } else {
      console.error('Could not find main config pattern in setup guide');
    }
  }

  // Update Asimov consensus config
  if (fs.existsSync(asimovPath)) {
    const asimovContent = fs.readFileSync(asimovPath, 'utf8');
    const asimovPattern = /(##### Testnet Asimov\s*```yaml[^\n]*\n)([\s\S]*?)(\n```)/;

    if (asimovPattern.test(setupGuideContent)) {
      setupGuideContent = setupGuideContent.replace(
        asimovPattern,
        `$1${asimovContent}$3`
      );
      console.log(`Updated Asimov config block at ${new Date().toISOString()}`);
    } else {
      console.error('Could not find Asimov config pattern in setup guide');
    }
  }

  // Update Bradbury consensus config
  if (fs.existsSync(bradburyPath)) {
    const bradburyContent = fs.readFileSync(bradburyPath, 'utf8');
    const bradburyPattern = /(##### Testnet Bradbury\s*```yaml[^\n]*\n)([\s\S]*?)(\n```)/;

    if (bradburyPattern.test(setupGuideContent)) {
      setupGuideContent = setupGuideContent.replace(
        bradburyPattern,
        `$1${bradburyContent}$3`
      );
      console.log(`Updated Bradbury config block at ${new Date().toISOString()}`);
    } else {
      console.error('Could not find Bradbury config pattern in setup guide');
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
