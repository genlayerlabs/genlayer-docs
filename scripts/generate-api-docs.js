#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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
  const apiDir = path.join(process.cwd(), 'pages/api-references/genlayer-node');
  const targetFile = path.join(process.cwd(), 'pages/api-references/genlayer-node.mdx');
  
  if (!fs.existsSync(apiDir)) {
    console.error(`API directory ${apiDir} does not exist`);
    return;
  }
  
  // Read gen methods
  const genDir = path.join(apiDir, 'gen');
  const genMethods = [];
  
  if (fs.existsSync(genDir)) {
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
  }
  
  // Read debug methods
  const debugDir = path.join(apiDir, 'debug');
  const debugMethods = [];
  
  if (fs.existsSync(debugDir)) {
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
  }
  
  // Generate the final API docs content
  const apiContent = `# GenLayer Node API

The GenLayer Node provides a [JSON-RPC API](https://www.jsonrpc.org/specification) for interacting with it. This API allows you to execute contract calls, retrieve transaction information, and perform various blockchain operations.

## GenLayer Methods

${genMethods.join('\n\n')}

## Debug Methods

These methods are available for debugging and testing purposes during development.

${debugMethods.join('\n\n')}

## Ethereum Compatibility

The GenLayer Node also supports Ethereum-compatible methods that are proxied to the underlying infrastructure. These methods follow the standard [Ethereum JSON-RPC specification](https://ethereum.org/en/developers/docs/apis/json-rpc/) and are prefixed with \`eth_\`.

**Examples of supported Ethereum methods:**

- \`eth_blockNumber\`
- \`eth_getBalance\`
- \`eth_sendTransaction\`
- \`eth_call\`
- And other standard Ethereum JSON-RPC methods

## zkSync Compatibility

[zkSync-compatible](https://docs.zksync.io/zksync-protocol/api/zks-rpc) methods are also supported and proxied to the underlying infrastructure. These methods are prefixed with \`zksync_\`.

## Usage Examples

### cURL

\`\`\`bash
# Test connectivity
curl -X POST http://localhost:9151 \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "gen_dbg_ping",
    "params": [],
    "id": 1
  }'

# Execute a contract call
curl -X POST http://localhost:9151 \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "gen_call",
    "params": [{
      "from": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6",
      "to": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6",
      "data": "0x70a08231000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4b4d8b6",
      "type": "read",
      "transaction_hash_variant": "latest-nonfinal"
    }],
    "id": 1
  }'

# Get contract schema
curl -X POST http://localhost:9151 \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "gen_getContractSchema",
    "params": [{
      "code": "IyB7ICJEZXBlbmRzIjogInB5LWdlbmxheWVyOnRlc3QiIH0KCmZyb20gZ2VubGF5ZXIgaW1wb3J0ICoKCgojIGNvbnRyYWN0IGNsYXNzCmNsYXNzIFN0b3JhZ2UoZ2wuQ29udHJhY3QpOgogICAgc3RvcmFnZTogc3RyCgogICAgIyBjb25zdHJ1Y3RvcgogICAgZGVmIF9faW5pdF9fKHNlbGYsIGluaXRpYWxfc3RvcmFnZTogc3RyKToKICAgICAgICBzZWxmLnN0b3JhZ2UgPSBpbml0aWFsX3N0b3JhZ2UKCiAgICAjIHJlYWQgbWV0aG9kcyBtdXN0IGJlIGFubm90YXRlZCB3aXRoIHZpZXcKICAgIEBnbC5wdWJsaWMudmlldwogICAgZGVmIGdldF9zdG9yYWdlKHNlbGYpIC0+IHN0cjoKICAgICAgICByZXR1cm4gc2VsZi5zdG9yYWdlCgogICAgIyB3cml0ZSBtZXRob2QKICAgIEBnbC5wdWJsaWMud3JpdGUKICAgIGRlZiB1cGRhdGVfc3RvcmFnZShzZWxmLCBuZXdfc3RvcmFnZTogc3RyKSAtPiBOb25lOgogICAgICAgIHNlbGYuc3RvcmFnZSA9IG5ld19zdG9yYWdlCg=="
    }],
    "id": 1
  }'

# Get debug trie information
curl -X POST http://localhost:9151 \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "gen_dbg_trie",
    "params": [{
      "txID": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6742d35Cc6634C0532925a3b8",
      "round": 0
    }],
    "id": 1
  }'

# Get transaction receipt
curl -X POST http://localhost:9151 \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "gen_getTransactionReceipt",
    "params": [{
      "txId": "0x635060dd514082096d18c8eb64682cc6a944f9ce1ae6982febf7a71e9f656f49"
    }],
    "id": 1
  }'
\`\`\``;
  
  // Write to the target file
  fs.writeFileSync(targetFile, apiContent);
  console.log(`Generated API docs with ${genMethods.length} gen methods and ${debugMethods.length} debug methods at ${new Date().toISOString()}`);
}

// Run the script
if (require.main === module) {
  generateApiDocs();
}

module.exports = { generateApiDocs };