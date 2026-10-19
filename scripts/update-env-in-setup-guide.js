#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// A generator that cannot find its source or its target block fails the build.
const fail = (msg) => { console.error(msg); process.exitCode = 1; };

/**
 * Paste content/validators/env.example (synced from genlayer-node
 * release/.env.example) into the `.env` block of the setup guide's
 * docker-compose section.
 */
function updateEnvInSetupGuide() {
  const projectRoot = path.join(__dirname, '..');
  const envPath = path.join(projectRoot, 'content/validators/env.example');
  const setupGuidePath = path.join(projectRoot, 'pages/validators/setup-guide.mdx');

  if (!fs.existsSync(envPath)) {
    fail(`Env example ${envPath} does not exist`);
    return;
  }
  if (!fs.existsSync(setupGuidePath)) {
    fail(`Setup guide file ${setupGuidePath} does not exist`);
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8').trimEnd();
  const setupGuideContent = fs.readFileSync(setupGuidePath, 'utf8');

  // The first ```env block after the step heading.
  const pattern = /(Set the required environment variables in a `\.env` file:[\s\S]*?```env[^\n]*\n)([\s\S]*?)(\n```)/;

  if (!pattern.test(setupGuideContent)) {
    fail('Could not find the .env block ("Set the required environment variables in a `.env` file:" followed by an env block) in setup guide');
    return;
  }

  fs.writeFileSync(setupGuidePath, setupGuideContent.replace(pattern, (_, before, _old, after) => `${before}${envContent}${after}`));
  console.log(`Updated setup guide .env block at ${new Date().toISOString()}`);
}

if (require.main === module) {
  updateEnvInSetupGuide();
}

module.exports = { updateEnvInSetupGuide };
