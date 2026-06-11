const fs = require('fs');
const path = require('path');

// Guards against silent regressions in the LLM exports — entire sections were
// once missing from llms-full.txt for months without anyone noticing.
// Runs right after generate-full-docs.js in dev/build.

const PUBLIC = path.join(process.cwd(), 'public');
const failures = [];

function read(relPath) {
  const fullPath = path.join(PUBLIC, relPath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`missing file: public/${relPath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

const llmsTxt = read('llms.txt');
const fullDocs = read('full-documentation.txt');
const llmsFull = read('llms-full.txt');
const apiBundle = read('api-references/llms-full.txt');

// 1. Coverage floors (update deliberately if pages are intentionally removed)
const llmsTxtLinks = (llmsTxt.match(/^- \[/gm) || []).length;
if (llmsTxtLinks < 200) {
  failures.push(`llms.txt lists only ${llmsTxtLinks} pages (floor: 200) — pages are being dropped`);
}
const rootPageCount = (fullDocs.match(/^Source: /gm) || []).length;
if (rootPageCount < 130) {
  failures.push(`full-documentation.txt has only ${rootPageCount} pages (floor: 130)`);
}
const apiPageCount = (apiBundle.match(/^Source: /gm) || []).length;
if (apiPageCount < 70) {
  failures.push(`api-references/llms-full.txt has only ${apiPageCount} pages (floor: 70) — CLI subtree may be missing`);
}

// 2. No JSX leaks — components must be converted to markdown
for (const [name, content] of [
  ['full-documentation.txt', fullDocs],
  ['api-references/llms-full.txt', apiBundle],
]) {
  const leak = content.match(/<(Callout|Cards|CustomCard|Tabs)[\s>]/);
  if (leak) {
    failures.push(`JSX leaked into ${name}: found "${leak[0].trim()}" — check cleanMdxContent()`);
  }
}

// 3. Known content anchors — each guards a subtree that once went missing
const anchors = [
  [fullDocs, 'full-documentation.txt', 'Source: https://docs.genlayer.com/api-references/genlayer-js'],
  [fullDocs, 'full-documentation.txt', 'Source: https://docs.genlayer.com/validators/setup-guide'],
  [fullDocs, 'full-documentation.txt', 'Equivalence Principle'],
  [apiBundle, 'api-references/llms-full.txt', 'validator-deposit'],
  [apiBundle, 'api-references/llms-full.txt', 'gen_call'],
];
for (const [content, name, anchor] of anchors) {
  if (content && !content.includes(anchor)) {
    failures.push(`anchor "${anchor}" not found in ${name}`);
  }
}

// 4. llms-full.txt must mirror full-documentation.txt
if (llmsFull && fullDocs && llmsFull !== fullDocs) {
  failures.push('llms-full.txt differs from full-documentation.txt');
}

// 5. Per-page mirrors exist and carry frontmatter
const sampleMirror = read('developers/intelligent-contracts/introduction.md');
if (sampleMirror && !/^---\ntitle:/.test(sampleMirror)) {
  failures.push('per-page .md mirror is missing its frontmatter header');
}

if (failures.length) {
  console.error('check-llm-exports: FAILED');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(
  `check-llm-exports: OK (llms.txt: ${llmsTxtLinks} pages, root bundle: ${rootPageCount}, api bundle: ${apiPageCount})`
);
