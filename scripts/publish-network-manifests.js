#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Publish the network protocol manifests synced from genlayer-node as static
 * downloads. content/validators/<network>.protocol-manifest.json is served at
 * /validators/<network>.protocol-manifest.json. The public copies are build
 * output (gitignored).
 */
const MANIFESTS = ['bradbury.protocol-manifest.json'];

function publishNetworkManifests() {
  const sourceDir = path.join(process.cwd(), 'content/validators');
  const targetDir = path.join(process.cwd(), 'public/validators');
  fs.mkdirSync(targetDir, { recursive: true });

  for (const name of MANIFESTS) {
    const source = path.join(sourceDir, name);
    if (!fs.existsSync(source)) {
      console.error(`Manifest ${source} does not exist`);
      process.exitCode = 1;
      continue;
    }
    // Fail the build on a manifest that is not valid JSON.
    JSON.parse(fs.readFileSync(source, 'utf8'));
    fs.copyFileSync(source, path.join(targetDir, name));
    console.log(`Published ${name} to public/validators/`);
  }
}

if (require.main === module) {
  publishNetworkManifests();
}

module.exports = { publishNetworkManifests };
