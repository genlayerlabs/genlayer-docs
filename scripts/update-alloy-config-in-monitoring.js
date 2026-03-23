#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update the monitoring page with the latest alloy-config.river from the synced content.
 * Replaces the river code block in monitoring.mdx with the current alloy-config.river file.
 */
function updateAlloyConfigInMonitoring() {
  const projectRoot = path.join(__dirname, '..');
  const alloyConfigPath = path.join(projectRoot, 'content/validators/alloy-config.river');
  const monitoringPath = path.join(projectRoot, 'pages/validators/monitoring.mdx');

  if (!fs.existsSync(alloyConfigPath)) {
    console.error(`Alloy config file ${alloyConfigPath} does not exist`);
    return;
  }

  if (!fs.existsSync(monitoringPath)) {
    console.error(`Monitoring file ${monitoringPath} does not exist`);
    return;
  }

  const alloyConfigContent = fs.readFileSync(alloyConfigPath, 'utf8').trimEnd();
  let monitoringContent = fs.readFileSync(monitoringPath, 'utf8');

  // Pattern to match the alloy-config.river code block in monitoring.mdx
  // It's the river block right after "Create or update ./alloy-config.river"
  const riverPattern = /(Create or update \.\/alloy-config\.river[^`]*```river\n)([\s\S]*?)(\n```)/;

  if (riverPattern.test(monitoringContent)) {
    monitoringContent = monitoringContent.replace(
      riverPattern,
      `$1${alloyConfigContent}$3`
    );

    fs.writeFileSync(monitoringPath, monitoringContent);
    console.log(`Updated monitoring alloy-config.river block at ${new Date().toISOString()}`);
  } else {
    console.error('Could not find alloy-config.river code block pattern in monitoring.mdx');
  }
}

// Run the script
if (require.main === module) {
  updateAlloyConfigInMonitoring();
}

module.exports = { updateAlloyConfigInMonitoring };
