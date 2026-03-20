#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update the monitoring page with the latest alloy service from the full docker-compose.
 * Extracts the alloy service definition + volumes section from the full (unsanitized)
 * docker-compose-monitoring.yaml and injects it into monitoring.mdx.
 */
function updateAlloyInMonitoring() {
  const projectRoot = path.join(__dirname, '..');
  const dockerComposePath = path.join(projectRoot, 'content/validators/docker-compose-monitoring.yaml');
  const monitoringPath = path.join(projectRoot, 'pages/validators/monitoring.mdx');

  if (!fs.existsSync(dockerComposePath)) {
    console.error(`Full docker-compose file ${dockerComposePath} does not exist`);
    return;
  }

  if (!fs.existsSync(monitoringPath)) {
    console.error(`Monitoring file ${monitoringPath} does not exist`);
    return;
  }

  const dockerComposeContent = fs.readFileSync(dockerComposePath, 'utf8');
  let monitoringContent = fs.readFileSync(monitoringPath, 'utf8');

  // Extract the alloy service block and volumes from the full docker-compose
  const alloyBlock = extractAlloyBlock(dockerComposeContent);

  if (!alloyBlock) {
    console.error('Could not extract alloy service block from docker-compose');
    return;
  }

  // Pattern to match the alloy docker-compose YAML block in monitoring.mdx
  // It's the yaml block right after "Add or verify the Alloy service in docker-compose.yaml"
  const alloyPattern = /(Add or verify the Alloy service in docker-compose\.yaml[^`]*```yaml\n)([\s\S]*?)(\n```)/;

  if (alloyPattern.test(monitoringContent)) {
    monitoringContent = monitoringContent.replace(
      alloyPattern,
      `$1${alloyBlock}$3`
    );

    fs.writeFileSync(monitoringPath, monitoringContent);
    console.log(`Updated monitoring alloy service block at ${new Date().toISOString()}`);
  } else {
    console.error('Could not find alloy service YAML block pattern in monitoring.mdx');
  }
}

/**
 * Extract the alloy service definition and volumes section from docker-compose content.
 * Uses regex-based approach to find the alloy service and volumes blocks.
 */
function extractAlloyBlock(content) {
  // Find the alloy service block: starts with comments before "  alloy:" and ends
  // before the next root-level key or end of services section
  const alloyMatch = content.match(/([ \t]*# .*[Aa]lloy[\s\S]*?)(^  alloy:[\s\S]*?)(?=^  \w|\nvolumes:|\n\S|$)/m);

  if (!alloyMatch) {
    // Try without leading comments
    const simpleMatch = content.match(/(^  alloy:[\s\S]*?)(?=^  \w|\nvolumes:|\n\S|$)/m);
    if (!simpleMatch) {
      return null;
    }
  }

  // Strategy: find start of alloy comments/service, then find volumes section
  const lines = content.split('\n');
  let startIdx = -1;
  let endIdx = lines.length;

  // Find the first comment line that mentions Alloy before the alloy: service
  for (let i = 0; i < lines.length; i++) {
    if (/^\s+alloy:/.test(lines[i])) {
      // Found alloy service, now look backwards for leading comments
      startIdx = i;
      for (let j = i - 1; j >= 0; j--) {
        if (/^\s*#/.test(lines[j]) || /^\s*$/.test(lines[j])) {
          // Only include if it's actually related (check if first non-empty going back mentions alloy)
          startIdx = j;
        } else {
          break;
        }
      }
      // Skip leading empty lines
      while (startIdx < i && lines[startIdx].trim() === '') {
        startIdx++;
      }
      break;
    }
  }

  if (startIdx === -1) {
    return null;
  }

  // Find the alloy service end: next service at same indent level (2 spaces + word char)
  // or volumes: at root level or end of file
  const alloyServiceIdx = lines.findIndex((l, idx) => idx >= startIdx && /^\s+alloy:/.test(l));
  for (let i = alloyServiceIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    // Root-level key (like volumes:)
    if (/^\S/.test(line) && line.trim() !== '') {
      // Include volumes section if it exists
      if (/^volumes:/.test(line)) {
        // Find end of volumes section
        for (let k = i + 1; k < lines.length; k++) {
          if (/^\S/.test(lines[k]) && lines[k].trim() !== '' && !/^volumes:/.test(lines[k])) {
            endIdx = k;
            break;
          }
        }
        if (endIdx === lines.length) {
          endIdx = lines.length;
        }
      } else {
        endIdx = i;
      }
      break;
    }
    // Another service at 2-space indent (but not deeper indentation of alloy's config)
    if (/^  \S/.test(line) && !/^  alloy/.test(line) && !/^  #/.test(line)) {
      endIdx = i;
      break;
    }
  }

  const result = lines.slice(startIdx, endIdx);

  // Clean up trailing empty lines
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop();
  }

  return result.length > 0 ? result.join('\n') : null;
}

// Run the script
if (require.main === module) {
  updateAlloyInMonitoring();
}

module.exports = { updateAlloyInMonitoring };
