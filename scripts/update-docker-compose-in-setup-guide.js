#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update the setup guide with the latest docker-compose from content/validators/docker-compose.yaml
 */
function updateDockerComposeInSetupGuide() {
  const projectRoot = path.join(__dirname, '..');
  const dockerComposePath = path.join(projectRoot, 'content/validators/docker-compose.yaml');
  const setupGuidePath = path.join(projectRoot, 'pages/validators/setup-guide.mdx');

  if (!fs.existsSync(dockerComposePath)) {
    console.error(`Docker compose file ${dockerComposePath} does not exist`);
    return;
  }

  if (!fs.existsSync(setupGuidePath)) {
    console.error(`Setup guide file ${setupGuidePath} does not exist`);
    return;
  }

  // Read the docker-compose.yaml content
  const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');

  // Read the setup guide
  let setupGuideContent = fs.readFileSync(setupGuidePath, 'utf8');

  // Pattern to match the docker-compose YAML block
  // Looks for the text before the yaml block, the yaml block itself, and the text after
  // Note: The yaml block may have additional attributes like "copy" (```yaml copy)
  const dockerComposePattern = /(Create a `docker-compose\.yaml` file with the following content:[^`]*```yaml[^\n]*\n)([\s\S]*?)(\n```)/;

  if (dockerComposePattern.test(setupGuideContent)) {
    // Replace the docker-compose content while preserving the surrounding text
    setupGuideContent = setupGuideContent.replace(
      dockerComposePattern,
      `$1${dockerComposeContent}$3`
    );

    // Write the updated content back
    fs.writeFileSync(setupGuidePath, setupGuideContent);
    console.log(`Updated setup guide docker-compose at ${new Date().toISOString()}`);
  } else {
    console.error('Could not find docker-compose pattern in setup guide');

    // Try a more general pattern as fallback
    // Look for a yaml block that contains typical docker-compose content
    const fallbackPattern = /(```yaml\n)([\s\S]*?)(\n```)/g;
    let match;
    let found = false;

    while ((match = fallbackPattern.exec(setupGuideContent)) !== null) {
      // Check if this looks like the docker-compose block by looking for typical docker-compose content
      if (match[2].includes('webdriver-container') || match[2].includes('genlayer-node:')) {
        const fullMatch = match[0];
        const startIndex = match.index;

        setupGuideContent =
          setupGuideContent.slice(0, startIndex) +
          `\`\`\`yaml\n${dockerComposeContent}\n\`\`\`` +
          setupGuideContent.slice(startIndex + fullMatch.length);

        fs.writeFileSync(setupGuidePath, setupGuideContent);
        console.log(`Updated setup guide docker-compose using fallback pattern at ${new Date().toISOString()}`);
        found = true;
        break;
      }
    }

    if (!found) {
      console.error('Could not find docker-compose YAML block in setup guide');
    }
  }
}

// Run the script
if (require.main === module) {
  updateDockerComposeInSetupGuide();
}

module.exports = { updateDockerComposeInSetupGuide };
