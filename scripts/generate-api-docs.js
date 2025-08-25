#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration constants - can be overridden by environment variables
const CONFIG = {
  API_DIR: process.env.API_DOCS_DIR || 'pages/api-references/genlayer-node',
  TARGET_FILE: process.env.API_DOCS_TARGET || 'pages/api-references/genlayer-node.mdx',
  TEMPLATE_FILE: process.env.API_TEMPLATE_FILE || 'content/api-references/genlayer-node/content.mdx',
  GEN_SUBDIR: process.env.API_GEN_SUBDIR || 'gen',
  DEBUG_SUBDIR: process.env.API_DEBUG_SUBDIR || 'debug',
  OPS_SUBDIR: process.env.API_OPS_SUBDIR || 'ops'
};

/**
 * Update _meta.json to match existing .mdx files
 */
function updateMetaJson(dirPath) {
  const metaPath = path.join(dirPath, '_meta.json');
  
  // Get all .mdx files in the directory
  const mdxFiles = fs.readdirSync(dirPath)
    .filter(file => file.endsWith('.mdx'))
    .sort();
  
  // Read existing meta.json if it exists
  let existingMeta = {};
  let existingOrder = [];
  
  if (fs.existsSync(metaPath)) {
    try {
      existingMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      existingOrder = Object.keys(existingMeta);
    } catch (err) {
      console.warn(`Failed to parse existing _meta.json: ${err.message}`);
    }
  }
  
  // Create new meta object preserving order for existing files
  const newMeta = {};
  
  // First, add files that were in the original order and still exist
  for (const key of existingOrder) {
    if (mdxFiles.includes(key + '.mdx')) {
      newMeta[key] = existingMeta[key] || key;
    }
  }
  
  // Then, add any new files that weren't in the original meta
  for (const file of mdxFiles) {
    const key = file.replace('.mdx', '');
    if (!newMeta[key]) {
      newMeta[key] = key;
    }
  }
  
  // Write updated meta.json if there are any changes
  const currentContent = fs.existsSync(metaPath) ? fs.readFileSync(metaPath, 'utf8').trim() : '';
  const newContent = JSON.stringify(newMeta, null, 2);
  
  if (currentContent !== newContent) {
    fs.writeFileSync(metaPath, newContent + '\n');
    console.log(`Updated ${metaPath}`);
  }
  
  return Object.keys(newMeta).map(key => key + '.mdx');
}

/**
 * Read all API method files and generate the combined content
 */
function generateApiDocs() {
  console.log('Generating API documentation with configuration:', CONFIG);
  
  const apiDir = path.join(process.cwd(), CONFIG.API_DIR);
  const targetFile = path.join(process.cwd(), CONFIG.TARGET_FILE);
  
  if (!fs.existsSync(apiDir)) {
    console.error(`API directory ${apiDir} does not exist`);
    return;
  }
  
  // Read gen methods
  const genDir = path.join(apiDir, CONFIG.GEN_SUBDIR);
  const genMethods = [];
  
  if (fs.existsSync(genDir)) {
    console.log(`Processing gen methods from ${genDir}`);
    // Update _meta.json and get file order
    const fileOrder = updateMetaJson(genDir);
    
    // Read content for each file in order
    for (const file of fileOrder) {
      const filePath = path.join(genDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8').trim();
        genMethods.push(content);
      }
    }
    console.log(`Found ${genMethods.length} gen methods`);
  } else {
    console.warn(`Gen methods directory ${genDir} does not exist - skipping`);
  }
  
  // Read debug methods
  const debugDir = path.join(apiDir, CONFIG.DEBUG_SUBDIR);
  const debugMethods = [];
  
  if (fs.existsSync(debugDir)) {
    console.log(`Processing debug methods from ${debugDir}`);
    // Update _meta.json and get file order
    const fileOrder = updateMetaJson(debugDir);
    
    // Read content for each file in order
    for (const file of fileOrder) {
      const filePath = path.join(debugDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8').trim();
        debugMethods.push(content);
      }
    }
    console.log(`Found ${debugMethods.length} debug methods`);
  } else {
    console.warn(`Debug methods directory ${debugDir} does not exist - skipping`);
  }
  
  // Read ops methods
  const opsDir = path.join(apiDir, CONFIG.OPS_SUBDIR);
  const opsMethods = [];
  
  if (fs.existsSync(opsDir)) {
    console.log(`Processing ops methods from ${opsDir}`);
    // Update _meta.json and get file order
    const fileOrder = updateMetaJson(opsDir);
    
    // Read content for each file in order
    for (const file of fileOrder) {
      const filePath = path.join(opsDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8').trim();
        opsMethods.push(content);
      }
    }
    console.log(`Found ${opsMethods.length} ops methods`);
  } else {
    console.warn(`Ops methods directory ${opsDir} does not exist - skipping`);
  }
  
  // Read the template file
  const templateFile = path.join(process.cwd(), CONFIG.TEMPLATE_FILE);
  
  if (!fs.existsSync(templateFile)) {
    console.error(`Template file ${templateFile} does not exist`);
    return;
  }
  
  let templateContent = fs.readFileSync(templateFile, 'utf8');
  console.log(`Using template from ${templateFile}`);
  
  // Process the template with method content using string replacement
  // Replace template variables with actual content
  let apiContent = templateContent
    .replace('${genMethods.join(\'\\n\\n\')}', genMethods.join('\n\n'))
    .replace('${debugMethods.join(\'\\n\\n\')}', debugMethods.join('\n\n'))
    .replace('${opsMethods.join(\'\\n\\n\')}', opsMethods.join('\n\n'));
  
  // Write to the target file
  fs.writeFileSync(targetFile, apiContent);
  console.log(`Generated API docs with ${genMethods.length} gen methods, ${debugMethods.length} debug methods, and ${opsMethods.length} ops methods at ${new Date().toISOString()}`);
}

// Run the script
if (require.main === module) {
  generateApiDocs();
}

module.exports = { generateApiDocs };