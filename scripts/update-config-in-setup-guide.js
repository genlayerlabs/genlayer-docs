#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update the setup guide with the latest config from content/validators/config.yaml
 */
function updateConfigInSetupGuide() {
  const configPath = path.join(process.cwd(), 'content/validators/config.yaml');
  const setupGuidePath = path.join(process.cwd(), 'pages/validators/setup-guide.mdx');
  
  if (!fs.existsSync(configPath)) {
    console.error(`Config file ${configPath} does not exist`);
    return;
  }
  
  if (!fs.existsSync(setupGuidePath)) {
    console.error(`Setup guide file ${setupGuidePath} does not exist`);
    return;
  }
  
  // Read the config.yaml content
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Read the setup guide
  let setupGuideContent = fs.readFileSync(setupGuidePath, 'utf8');
  
  // Pattern to match the YAML config block
  // Looks for the text before the yaml block, the yaml block itself, and the text after
  const configPattern = /(You can use the following example configuration[^`]*```yaml\n)([\s\S]*?)(\n```)/;
  
  if (configPattern.test(setupGuideContent)) {
    // Replace the config content while preserving the surrounding text
    setupGuideContent = setupGuideContent.replace(
      configPattern,
      `$1${configContent}$3`
    );
    
    // Write the updated content back
    fs.writeFileSync(setupGuidePath, setupGuideContent);
    console.log(`Updated setup guide config at ${new Date().toISOString()}`);
  } else {
    console.error('Could not find config pattern in setup guide');
    
    // Try a more general pattern as fallback
    const fallbackPattern = /(```yaml\n)([\s\S]*?)(\n```)/;
    const matches = setupGuideContent.match(fallbackPattern);
    
    if (matches) {
      // Check if this looks like the config block by looking for consensus addresses
      if (matches[2].includes('contractmanageraddress') || matches[2].includes('consensus:')) {
        setupGuideContent = setupGuideContent.replace(
          fallbackPattern,
          `$1${configContent}$3`
        );
        fs.writeFileSync(setupGuidePath, setupGuideContent);
        console.log(`Updated setup guide config using fallback pattern at ${new Date().toISOString()}`);
      } else {
        console.error('Found YAML block but it does not appear to be the config block');
      }
    } else {
      console.error('Could not find any YAML block in setup guide');
    }
  }
}

// Run the script
if (require.main === module) {
  updateConfigInSetupGuide();
}

module.exports = { updateConfigInSetupGuide };