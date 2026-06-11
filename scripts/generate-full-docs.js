const fs = require('fs');
const path = require('path');
const { buildGitDates } = require('./lib/git-dates');

const DOMAIN = 'https://docs.genlayer.com';

// Function to read and parse _meta.json files
function parseMetaJson(dir) {
  const metaFilePath = path.join(dir, '_meta.json');
  if (fs.existsSync(metaFilePath)) {
    const metaContent = fs.readFileSync(metaFilePath, 'utf8');
    return JSON.parse(metaContent);
  }
  return null;
}

function titleFromFilename(filename) {
  return filename
    .replace(/\.mdx?$/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Collect all documentation pages (.mdx and .md), following _meta.json order
// first, then sweeping up any files/directories not listed in _meta.json so
// pages are never silently dropped (e.g. the CLI command subtrees and the
// generated .md API references).
function collectPages(baseDir) {
  const pages = [];
  const visitedFiles = new Set();
  const visitedDirs = new Set();

  function visitFile(filePath, title) {
    if (visitedFiles.has(filePath)) return;
    visitedFiles.add(filePath);
    pages.push({ filePath, title });
  }

  function traverseDirectory(dir) {
    if (visitedDirs.has(dir)) return;
    visitedDirs.add(dir);

    const meta = parseMetaJson(dir) || {};

    for (const key of Object.keys(meta)) {
      if (key.startsWith('_')) continue;
      const value = meta[key];
      if (value && typeof value === 'object' && value.href) continue; // external link
      if (value && typeof value === 'object' && value.type === 'separator' && !value.title) continue;
      const title =
        typeof value === 'string' ? value : (value && value.title) || titleFromFilename(key);

      for (const ext of ['.mdx', '.md']) {
        const filePath = path.join(dir, key + ext);
        if (fs.existsSync(filePath)) {
          visitFile(filePath, title);
          break;
        }
      }

      const subDir = path.join(dir, key);
      if (fs.existsSync(subDir) && fs.statSync(subDir).isDirectory()) {
        traverseDirectory(subDir);
      }
    }

    // Sweep: pick up anything not referenced by _meta.json
    for (const entry of fs.readdirSync(dir).sort()) {
      if (entry.startsWith('_') || entry.startsWith('.')) continue;
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        traverseDirectory(fullPath);
      } else if (/\.mdx?$/.test(entry)) {
        visitFile(fullPath, titleFromFilename(entry));
      }
    }
  }

  traverseDirectory(baseDir);
  return pages;
}

function routeForPage(filePath, pagesDir) {
  let route = path
    .relative(pagesDir, filePath)
    .replace(/\.mdx?$/, '')
    .split(path.sep)
    .join('/');
  return route.replace(/(^|\/)index$/, '$1').replace(/\/$/, '');
}

// Minimal flat-YAML frontmatter parser (string values only)
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { data: {}, content: raw };
  const data = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { data, content: raw.slice(match[0].length) };
}

function parseAttributes(attrString) {
  const attrs = {};
  const attrRegex = /(\w+)=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{"([^"]*)"\}|\{'([^']*)'\})/g;
  let match;
  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? '';
  }
  return attrs;
}

const CALLOUT_LABELS = {
  info: 'Note',
  warning: 'Warning',
  error: 'Caution',
  tip: 'Tip',
};

// Block-level components that can legitimately wrap fenced code blocks —
// transform these across the whole document before fence-splitting.
function transformBlockJsx(text) {
  // <Callout type="info"> ... </Callout> -> blockquote
  text = text.replace(/<Callout([^>]*)>([\s\S]*?)<\/Callout>/g, (_, attrString, inner) => {
    const attrs = parseAttributes(attrString);
    const label = CALLOUT_LABELS[attrs.type] || 'Note';
    const lines = inner.trim().split('\n');
    const quoted = lines.map(line => `> ${line.replace(/^  /, '')}`.trimEnd()).join('\n');
    return `> **${label}:**\n${quoted}`;
  });

  // <Tabs items={['A', 'B']}> ... </Tabs> -> labeled sections
  text = text.replace(
    /<Tabs\s+items=\{\[([\s\S]*?)\]\}\s*>([\s\S]*?)<\/Tabs>/g,
    (_, itemsString, body) => {
      const items = [...itemsString.matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]);
      let index = 0;
      const sections = [];
      body.replace(/<Tabs\.Tab>([\s\S]*?)<\/Tabs\.Tab>/g, (__, tabContent) => {
        const label = items[index] || `Option ${index + 1}`;
        index += 1;
        const lines = tabContent.replace(/^\n+|\s+$/g, '').split('\n');
        const indents = lines
          .filter(line => line.trim())
          .map(line => line.match(/^ */)[0].length);
        const commonIndent = indents.length ? Math.min(...indents) : 0;
        const dedented = lines.map(line => line.slice(commonIndent)).join('\n');
        sections.push(`**${label}:**\n\n${dedented}`);
        return '';
      });
      return sections.join('\n\n');
    }
  );

  return text;
}

// Convert MDX/JSX constructs in a non-code text segment to plain markdown
function transformJsxSegment(text) {
  // MDX comments
  text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  // import/export statements (code samples live inside fences, so this is safe here)
  text = text.replace(/^import\s.+$/gm, '');
  text = text.replace(/^export\s+(const|default|let|var)\s.+$/gm, '');

  // <Card title="..." href="..." /> -> markdown link bullet
  text = text.replace(/<(?:Custom)?Card\s+([^>]*?)\/?>(?:<\/(?:Custom)?Card>)?/g, (_, attrString) => {
    const attrs = parseAttributes(attrString);
    if (!attrs.title) return '';
    const link = attrs.href ? `[${attrs.title}](${attrs.href})` : attrs.title;
    return attrs.description ? `- ${link}: ${attrs.description}` : `- ${link}`;
  });
  text = text.replace(/<\/?Cards[^>]*>/g, '');

  // <Image src="..." alt="..." /> -> markdown image
  text = text.replace(/<Image\s+([^>]*?)\/?>/g, (_, attrString) => {
    const attrs = parseAttributes(attrString);
    return attrs.src ? `![${attrs.alt || ''}](${attrs.src})` : '';
  });

  // <iframe src="..."> -> link to the embedded content
  text = text.replace(/<iframe([^>]*)>[\s\S]*?<\/iframe>|<iframe([^>]*)\/>/g, (match, a, b) => {
    const attrs = parseAttributes(a || b || '');
    return attrs.src ? `[Embedded content](${attrs.src})` : '';
  });

  // Remaining presentational wrappers
  text = text.replace(/<br\s*\/?>/g, '\n');
  text = text.replace(/<\/?(div|span|Bleed|Fragment|details|summary|AddToWallet|CopyPage)[^>]*\/?>/g, '');

  return text;
}

// Apply JSX-to-markdown transforms outside fenced code blocks only
function cleanMdxContent(content) {
  content = transformBlockJsx(content);

  const segments = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  const cleaned = segments
    .map((segment, i) => (i % 2 === 0 ? transformJsxSegment(segment) : segment))
    .join('');

  // Collapse runs of blank lines left behind by removed JSX
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

// First plain-text paragraph after the H1, for use as a link description
function extractDescription(markdown) {
  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^(#|!\[|>|```|\||-|\*|\d+\.|<)/.test(trimmed)) continue;
    // Strip markdown links/emphasis, keep the text
    let text = trimmed
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_`]/g, '')
      .trim();
    if (text.length < 20) continue;
    if (text.length > 160) {
      text = text.slice(0, 160).replace(/\s+\S*$/, '') + '…';
    }
    return text;
  }
  return '';
}

function preparePage(page, pagesDir, gitDates) {
  const raw = fs.readFileSync(page.filePath, 'utf8');
  const { data: frontmatter, content } = parseFrontmatter(raw);
  let markdown = cleanMdxContent(content);

  const route = routeForPage(page.filePath, pagesDir);
  const url = route ? `${DOMAIN}/${route}` : DOMAIN;

  const lines = markdown.split('\n');
  const h1Index = lines.findIndex(line => /^#\s/.test(line));
  const title =
    frontmatter.title || (h1Index !== -1 ? lines[h1Index].replace(/^#\s*/, '').trim() : page.title);
  if (h1Index === -1) {
    markdown = `# ${title}\n\n${markdown}`;
  }

  const description = frontmatter.description || extractDescription(markdown);
  const lastUpdated =
    gitDates[page.filePath] ||
    new Date(fs.statSync(page.filePath).mtime).toISOString().slice(0, 10);

  return {
    route,
    url,
    title,
    description,
    lastUpdated,
    markdown,
    section: route.includes('/') ? route.split('/')[0] : route || 'index',
  };
}

// One concatenated-export entry: H1, then Source: URL, then body
function fullDocsEntry(page) {
  const lines = page.markdown.split('\n');
  const h1Index = lines.findIndex(line => /^#\s/.test(line));
  lines.splice(h1Index + 1, 0, `Source: ${page.url}`);
  return lines.join('\n');
}

function writePageMirrors(pages, outputDir) {
  for (const page of pages) {
    const relPath = page.route ? `${page.route}.md` : 'index.md';
    const outPath = path.join(outputDir, relPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const frontmatter = [
      '---',
      `title: "${page.title.replace(/"/g, "'")}"`,
      page.description ? `description: "${page.description.replace(/"/g, "'")}"` : null,
      `source: ${page.url}`,
      `last_updated: ${page.lastUpdated}`,
      '---',
    ]
      .filter(Boolean)
      .join('\n');
    fs.writeFileSync(outPath, `${frontmatter}\n\n${page.markdown}\n`);
  }
}

const LLMS_TXT_PREAMBLE = `# GenLayer Documentation

> GenLayer is the first Intelligent Blockchain — a DLT capable of nondeterministic operations through dynamic consensus, enabling smart contracts ("Intelligent Contracts", written in Python) to natively access the Internet, call LLMs, and make subjective decisions. Consensus over nondeterministic results is reached through Optimistic Democracy and the Equivalence Principle.

Instructions for AI agents and LLMs:

- Every page below links to its raw markdown version. You can also append \`.md\` to any docs URL (e.g. ${DOMAIN}/developers/intelligent-contracts/introduction.md).
- The complete documentation in a single file: ${DOMAIN}/llms-full.txt (omits the per-command CLI pages). Section-scoped bundles: ${DOMAIN}/understand-genlayer-protocol/llms-full.txt, ${DOMAIN}/developers/llms-full.txt, ${DOMAIN}/validators/llms-full.txt, ${DOMAIN}/api-references/llms-full.txt (includes the full CLI command reference).
- To build Intelligent Contracts or run a validator with AI assistance, install the GenLayer Skills plugin for Claude Code: https://skills.genlayer.com/
- Key entry points: "What is GenLayer" for concepts, "Your First Contract" for development, "Setup Guide" for validators, "GenLayerJS" for dApps.
`;

function generateLlmsTxt(pages, rootMeta) {
  const sectionTitles = {};
  for (const key of Object.keys(rootMeta)) {
    const value = rootMeta[key];
    if (value && typeof value === 'object' && value.href) continue;
    sectionTitles[key] = typeof value === 'string' ? value : (value && value.title) || key;
  }

  const optionalSections = new Set(['partners']);
  const groups = new Map();
  for (const page of pages) {
    const key = page.route.includes('/') ? page.route.split('/')[0] : page.route || 'index';
    const groupKey = sectionTitles[key] ? key : 'index';
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(page);
  }

  let output = LLMS_TXT_PREAMBLE;

  const orderedKeys = Object.keys(sectionTitles).filter(key => groups.has(key));
  for (const key of orderedKeys) {
    if (optionalSections.has(key)) continue;
    const heading = key === 'index' ? 'Overview' : sectionTitles[key];
    output += `\n## ${heading}\n\n`;
    for (const page of groups.get(key)) {
      const mdUrl = page.route ? `${DOMAIN}/${page.route}.md` : `${DOMAIN}/index.md`;
      output += page.description
        ? `- [${page.title}](${mdUrl}): ${page.description}\n`
        : `- [${page.title}](${mdUrl})\n`;
    }
  }

  output += `\n## Optional\n\n`;
  for (const key of orderedKeys) {
    if (!optionalSections.has(key)) continue;
    for (const page of groups.get(key)) {
      const mdUrl = `${DOMAIN}/${page.route}.md`;
      output += page.description
        ? `- [${page.title}](${mdUrl}): ${page.description}\n`
        : `- [${page.title}](${mdUrl})\n`;
    }
  }

  return output;
}

// Main function
function generateFullDocs() {
  const pagesDir = path.join(process.cwd(), 'pages');
  const outputDir = path.join(process.cwd(), 'public');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const gitDates = buildGitDates();
  const pages = collectPages(pagesDir)
    .filter(page => {
      // Skip tiny "This page has moved" redirect stubs kept for SEO
      const raw = fs.readFileSync(page.filePath, 'utf8');
      return !(raw.length < 500 && /This page has moved/i.test(raw));
    })
    .map(page => preparePage(page, pagesDir, gitDates));

  // 1. Single-file concatenated export (legacy name + llms-full.txt).
  // The individual CLI command pages are omitted here to keep the root
  // bundle within a single context window — the genlayer-cli overview page
  // stays in, and the full command reference lives in
  // api-references/llms-full.txt.
  const rootPages = pages.filter(
    page => !page.route.startsWith('api-references/genlayer-cli/')
  );
  const fullContent = rootPages.map(fullDocsEntry).join('\n\n---\n\n') + '\n';
  fs.writeFileSync(path.join(outputDir, 'full-documentation.txt'), fullContent);
  const llmsFullPath = path.join(outputDir, 'llms-full.txt');
  if (fs.existsSync(llmsFullPath) && fs.lstatSync(llmsFullPath).isSymbolicLink()) {
    fs.unlinkSync(llmsFullPath);
  }
  fs.writeFileSync(llmsFullPath, fullContent);

  // 2. Section-scoped bundles (kept well under a single context window)
  const sections = ['understand-genlayer-protocol', 'developers', 'validators', 'api-references'];
  for (const section of sections) {
    const sectionPages = pages.filter(
      page => page.route === section || page.route.startsWith(`${section}/`)
    );
    if (!sectionPages.length) continue;
    const sectionDir = path.join(outputDir, section);
    fs.mkdirSync(sectionDir, { recursive: true });
    fs.writeFileSync(
      path.join(sectionDir, 'llms-full.txt'),
      sectionPages.map(fullDocsEntry).join('\n\n---\n\n') + '\n'
    );
  }

  // 3. Per-page markdown mirrors (served at <page-url>.md)
  writePageMirrors(pages, outputDir);

  // 4. llms.txt index
  const rootMeta = parseMetaJson(pagesDir) || {};
  fs.writeFileSync(path.join(outputDir, 'llms.txt'), generateLlmsTxt(pages, rootMeta));

  console.log(
    `generate-full-docs: ${pages.length} pages -> full-documentation.txt, llms-full.txt ` +
      `(${rootPages.length} pages, CLI command pages only in api-references bundle), ` +
      `${sections.length} section bundles, per-page .md mirrors, llms.txt`
  );
}

generateFullDocs();
