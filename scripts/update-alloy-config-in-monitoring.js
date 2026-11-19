#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// A generator that cannot find its source or its target block fails the build.
const fail = (msg) => { console.error(msg); process.exitCode = 1; };

/**
 * Update the monitoring page with the latest alloy-config.river from the synced content.
 * Replaces the river code block in monitoring.mdx with the current alloy-config.river file.
 */
function updateAlloyConfigInMonitoring() {
  const projectRoot = path.join(__dirname, '..');
  const alloyConfigPath = path.join(projectRoot, 'content/validators/alloy-config.river');
  const monitoringPath = path.join(projectRoot, 'pages/validators/monitoring.mdx');

  if (!fs.existsSync(alloyConfigPath)) {
    fail(`Alloy config file ${alloyConfigPath} does not exist`);
    return;
  }

  if (!fs.existsSync(monitoringPath)) {
    fail(`Monitoring file ${monitoringPath} does not exist`);
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
      (_, before, _old, after) => before + alloyConfigContent + after
    );

    fs.writeFileSync(monitoringPath, monitoringContent);
    console.log(`Updated monitoring alloy-config.river block at ${new Date().toISOString()}`);
  } else {
    fail('Could not find alloy-config.river code block pattern in monitoring.mdx');
  }
}

// Run the script
if (require.main === module) {
  updateAlloyConfigInMonitoring();
}

module.exports = { updateAlloyConfigInMonitoring };
