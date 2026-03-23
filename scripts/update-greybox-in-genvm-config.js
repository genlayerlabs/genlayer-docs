#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update the genvm-configuration page with the latest greybox setup guide.
 * Replaces everything from "## Greyboxing LLMs" to EOF in genvm-configuration.mdx
 * with the content of content/validators/greybox-setup-guide.md (stripping the H1 title).
 */
function updateGreyboxInGenvmConfig() {
  const projectRoot = path.join(__dirname, '..');
  const greyboxPath = path.join(projectRoot, 'content/validators/greybox-setup-guide.md');
  const genvmConfigPath = path.join(projectRoot, 'pages/validators/genvm-configuration.mdx');

  if (!fs.existsSync(greyboxPath)) {
    console.error(`Greybox setup guide ${greyboxPath} does not exist`);
    return;
  }

  if (!fs.existsSync(genvmConfigPath)) {
    console.error(`GenVM configuration file ${genvmConfigPath} does not exist`);
    return;
  }

  let greyboxContent = fs.readFileSync(greyboxPath, 'utf8').trimEnd();
  let genvmContent = fs.readFileSync(genvmConfigPath, 'utf8');

  // Strip the H1 title line and any immediately following blank lines from the greybox content
  // The H1 is not needed since the MDX already has its own section heading
  greyboxContent = greyboxContent.replace(/^# [^\n]*\n\n?/, '');

  // Replace everything from "## Greyboxing LLMs" (or similar H2 heading about greybox)
  // to the end of the file
  const greyboxSectionPattern = /## Greybox(?:ing)? LLMs[\s\S]*$/;

  if (greyboxSectionPattern.test(genvmContent)) {
    genvmContent = genvmContent.replace(
      greyboxSectionPattern,
      `## Greyboxing LLMs\n\n${greyboxContent}\n`
    );

    fs.writeFileSync(genvmConfigPath, genvmContent);
    console.log(`Updated genvm-configuration greybox section at ${new Date().toISOString()}`);
  } else {
    console.error('Could not find Greyboxing LLMs section in genvm-configuration.mdx');
  }
}

// Run the script
if (require.main === module) {
  updateGreyboxInGenvmConfig();
}

module.exports = { updateGreyboxInGenvmConfig };
