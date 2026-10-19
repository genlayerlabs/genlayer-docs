#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// A generator that cannot find its source or its target block fails the build.
const fail = (msg) => { console.error(msg); process.exitCode = 1; };

const GENERATED_NOTE =
  '{/* Generated from content/validators/greybox-setup-guide.md (genlayer-node release/greybox-setup-guide.md) by scripts/update-greybox-in-genvm-config.js. Do not edit here. */}\n\n';

/**
 * Publish the node's greybox setup guide as its own page,
 * pages/validators/greybox-setup.mdx. The GenVM Configuration page explains
 * greyboxing and links here for the setup steps. The page is rewritten whole,
 * so there is no anchor to drift.
 */
function updateGreyboxPage() {
  const projectRoot = path.join(__dirname, '..');
  const greyboxPath = path.join(projectRoot, 'content/validators/greybox-setup-guide.md');
  const pagePath = path.join(projectRoot, 'pages/validators/greybox-setup.mdx');

  if (!fs.existsSync(greyboxPath)) {
    fail(`Greybox setup guide ${greyboxPath} does not exist`);
    return;
  }

  const content = fs.readFileSync(greyboxPath, 'utf8').trimEnd();
  if (!/^# /.test(content)) {
    fail(`Greybox setup guide ${greyboxPath} must start with an H1 title`);
    return;
  }

  fs.writeFileSync(pagePath, `${GENERATED_NOTE}${content}\n`);
  console.log(`Updated ${path.relative(projectRoot, pagePath)} at ${new Date().toISOString()}`);
}

if (require.main === module) {
  updateGreyboxPage();
}

module.exports = { updateGreyboxPage, GENERATED_NOTE };
