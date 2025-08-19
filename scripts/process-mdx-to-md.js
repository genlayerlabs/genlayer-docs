const fs = require('fs');
const path = require('path');

function processMdxToMarkdown(content) {
  const baseUrl = 'https://docs.genlayer.com';
  
  // Helper function to convert relative URLs to absolute
  function makeAbsoluteUrl(url) {
    // Keep anchors as-is
    if (url.startsWith('#')) return url;

    // Absolute URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return encodeURI(url);
    }

    // Relative to root
    if (url.startsWith('/')) {
      return encodeURI(baseUrl + url);
    }

    // Other relative paths
    return encodeURI(url);
  }

  let processed = content;

  // Remove import statements
  processed = processed.replace(/^import\s+.*$/gm, '');

  // Convert CustomCard components to markdown links
  processed = processed.replace(
    /<CustomCard([^>]*)\/>/g,
    (match, attrs) => {
      // Extract attributes regardless of order
      const titleMatch = attrs.match(/title="([^"]*)"/);
      const descMatch = attrs.match(/description="([^"]*)"/);
      const hrefMatch = attrs.match(/href="([^"]*)"/);
      
      if (titleMatch && hrefMatch) {
        const title = titleMatch[1];
        const description = descMatch ? descMatch[1] : '';
        const absoluteUrl = makeAbsoluteUrl(hrefMatch[1]);
        return description 
          ? `- **[${title}](${absoluteUrl})**: ${description}`
          : `- **[${title}](${absoluteUrl})**`;
      }
      return match; // Return unchanged if required attributes are missing
    }
  );

  // Convert Card components to markdown links
  processed = processed.replace(
    /<Card([^>]*)\/>/g,
    (match, attrs) => {
      // Extract attributes regardless of order
      const titleMatch = attrs.match(/title="([^"]*)"/);
      const hrefMatch = attrs.match(/href="([^"]*)"/);
      
      if (titleMatch && hrefMatch) {
        const title = titleMatch[1];
        const absoluteUrl = makeAbsoluteUrl(hrefMatch[1]);
        return `- **[${title}](${absoluteUrl})**`;
      }
      return match; // Return unchanged if required attributes are missing
    }
  );

  // Convert simple JSX links to markdown
  processed = processed.replace(
    /<a\s+href="([^"]*)"[^>]*>([^<]*)<\/a>/g,
    (match, href, text) => {
      const absoluteUrl = makeAbsoluteUrl(href);
      return `[${text}](${absoluteUrl})`;
    }
  );

  // Convert Callout components to markdown blockquotes
  processed = processed.replace(
    /<Callout([^>]*)>([\s\S]*?)<\/Callout>/g,
    (match, attrs, content) => {
      // Extract attributes regardless of order
      const typeMatch = attrs.match(/type="([^"]*)"/);
      const type = typeMatch ? typeMatch[1] : '';
      const cleanContent = content.trim();
      const prefix = type === 'warning' ? '⚠️ ' : type === 'info' ? 'ℹ️ ' : '';
      return `> ${prefix}${cleanContent}`;
    }
  );

  // Convert Tabs with labeled items into headings with their respective content
  processed = processed.replace(
    /<Tabs[^>]*items=\{\[([\s\S]*?)\]\}[^>]*>([\s\S]*?)<\/Tabs>/g,
    (match, itemsRaw, inner) => {
      const tabTitles = itemsRaw
        .split(',')
        .map(s => s.trim())
        .map(s => s.replace(/^["']|["']$/g, ''))
        .filter(Boolean);

      const tabContents = [];
      const tabRegex = /<Tabs\.Tab[^>]*>([\s\S]*?)<\/Tabs\.Tab>/g;
      let m;
      while ((m = tabRegex.exec(inner)) !== null) {
        tabContents.push(m[1].trim());
      }

      // Map titles to contents; if counts mismatch, best-effort pairing
      const sections = [];
      const count = Math.max(tabTitles.length, tabContents.length);
      for (let i = 0; i < count; i++) {
        const title = tabTitles[i] || `Tab ${i + 1}`;
        const content = (tabContents[i] || '').trim();
        if (content) {
          sections.push(`### ${title}\n\n${content}`);
        } else {
          sections.push(`### ${title}`);
        }
      }
      return sections.join('\n\n');
    }
  );

  // Fallback: strip any remaining Tabs wrappers (keep inner content)
  processed = processed.replace(/<Tabs[^>]*>/g, '');
  processed = processed.replace(/<\/Tabs>/g, '');
  processed = processed.replace(/<Tabs\.Tab[^>]*>/g, '');
  processed = processed.replace(/<\/Tabs\.Tab>/g, '');

  // Strip Cards container (individual <Card/> handled above)
  processed = processed.replace(/<Cards[^>]*>/g, '');
  processed = processed.replace(/<\/Cards>/g, '');

  // Strip Bleed wrapper
  processed = processed.replace(/<Bleed[^>]*>/g, '');
  processed = processed.replace(/<\/Bleed>/g, '');

  // Strip Fragment wrapper
  processed = processed.replace(/<Fragment[^>]*>/g, '');
  processed = processed.replace(/<\/Fragment>/g, '');

  // Convert simple HTML divs to text (remove div tags but keep content)
  processed = processed.replace(/<div[^>]*>([\s\S]*?)<\/div>/g, '$1');

  // Convert <br/> tags to line breaks
  processed = processed.replace(/<br\s*\/?>(?!\s*<\/)/g, '\n');

  // Convert Image components to markdown images (with alt) - leave src as-is to avoid double-encoding
  processed = processed.replace(
    /<Image[^>]*\s+src="([^"]*)"[^>]*\s+alt="([^"]*)"[^>]*\/?>(?!\s*<\/Image>)/g,
    (match, src, alt) => {
      return `![${alt}](${src})`;
    }
  );

  // Convert Image components to markdown images (without alt) - leave src as-is
  processed = processed.replace(
    /<Image[^>]*\s+src="([^"]*)"[^>]*\/?>(?!\s*<\/Image>)/g,
    (match, src) => {
      return `![Image](${src})`;
    }
  );

  // Convert regular <img> tags to markdown images - leave src as-is
  processed = processed.replace(
    /<img[^>]*\s+src="([^"]*)"[^>]*\s+alt="([^"]*)"[^>]*\/?>(?!\s*<\/img>)/g,
    (match, src, alt) => {
      return `![${alt}](${src})`;
    }
  );

  // Convert regular markdown images to absolute URLs
  processed = processed.replace(
    /!\[([^\]]*)\]\(([^)]*)\)/g,
    (match, alt, src) => {
      const absoluteUrl = makeAbsoluteUrl(src);
      return `![${alt}](${absoluteUrl})`;
    }
  );

  // Convert regular markdown links to absolute URLs (skip images)
  processed = processed.replace(
    /(^|[^!])\[([^\]]*)\]\(([^)]*)\)/gm,
    (match, prefix, text, href) => {
      const absoluteUrl = makeAbsoluteUrl(href);
      return `${prefix}[${text}](${absoluteUrl})`;
    }
  );

  // Remove empty lines created by import removal and clean up
  processed = processed
    .split('\n')
    .filter((line, index, array) => {
      // Remove empty lines at the start
      if (index === 0 && line.trim() === '') return false;
      // Remove multiple consecutive empty lines
      if (line.trim() === '' && array[index - 1] && array[index - 1].trim() === '') return false;
      return true;
    })
    .join('\n')
    .trim();

  // Normalize list indentation (remove unintended leading spaces before list markers)
  processed = processed.replace(/^[ \t]+- /gm, '- ');

  return processed;
}

function processAllMdxFiles() {
  const pagesDir = path.join(process.cwd(), 'pages');
  const publicPagesDir = path.join(process.cwd(), 'public', 'pages');

  // Create public/pages directory if it doesn't exist
  if (!fs.existsSync(publicPagesDir)) {
    fs.mkdirSync(publicPagesDir, { recursive: true });
  }

  function processDirectory(sourceDir, targetDir) {
    const items = fs.readdirSync(sourceDir);

    items.forEach(item => {
      const sourcePath = path.join(sourceDir, item);
      const stat = fs.statSync(sourcePath);

      if (stat.isDirectory()) {
        const newTargetDir = path.join(targetDir, item);
        if (!fs.existsSync(newTargetDir)) {
          fs.mkdirSync(newTargetDir, { recursive: true });
        }
        processDirectory(sourcePath, newTargetDir);
      } else if (item.endsWith('.mdx')) {
        const content = fs.readFileSync(sourcePath, 'utf8');
        const processedContent = processMdxToMarkdown(content);
        
        const targetPath = path.join(targetDir, item.replace('.mdx', '.md'));
        fs.writeFileSync(targetPath, processedContent);
      }
    });
  }

  processDirectory(pagesDir, publicPagesDir);
  console.log('✅ Processed all MDX files to clean Markdown');
}

processAllMdxFiles();
