const fs = require('fs');
const path = require('path');

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

function urlForPage(filePath, pagesDir) {
  let route = path
    .relative(pagesDir, filePath)
    .replace(/\.mdx?$/, '')
    .split(path.sep)
    .join('/');
  route = route.replace(/(^|\/)index$/, '$1').replace(/\/$/, '');
  return route ? `${DOMAIN}/${route}` : DOMAIN;
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
  // Strip frontmatter
  content = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  content = transformBlockJsx(content);

  const segments = content.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  const cleaned = segments
    .map((segment, i) => (i % 2 === 0 ? transformJsxSegment(segment) : segment))
    .join('');

  // Collapse runs of blank lines left behind by removed JSX
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

// Prefix each page with its canonical URL so agents can cite/return to it,
// and guarantee an H1 so pages chunk cleanly.
function formatPage({ filePath, title }, pagesDir) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const content = cleanMdxContent(raw);
  const url = urlForPage(filePath, pagesDir);

  const lines = content.split('\n');
  const h1Index = lines.findIndex(line => /^#\s/.test(line));

  if (h1Index !== -1) {
    lines.splice(h1Index + 1, 0, `Source: ${url}`);
    return lines.join('\n');
  }
  return `# ${title}\nSource: ${url}\n\n${content}`;
}

// Main function
function generateFullDocs() {
  const pagesDir = path.join(process.cwd(), 'pages');
  const outputDir = path.join(process.cwd(), 'public');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const pages = collectPages(pagesDir).filter(page => {
    // Skip tiny "This page has moved" redirect stubs kept for SEO
    const raw = fs.readFileSync(page.filePath, 'utf8');
    return !(raw.length < 500 && /This page has moved/i.test(raw));
  });
  const fullContent = pages.map(page => formatPage(page, pagesDir)).join('\n\n---\n\n');

  fs.writeFileSync(path.join(outputDir, 'full-documentation.txt'), fullContent + '\n');
  console.log(`generate-full-docs: wrote ${pages.length} pages to public/full-documentation.txt`);
}

generateFullDocs();
