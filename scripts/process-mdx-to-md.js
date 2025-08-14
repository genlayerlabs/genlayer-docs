const fs = require('fs');
const path = require('path');

function processMdxToMarkdown(content) {
  const baseUrl = 'https://docs.genlayer.com';
  
  // Helper function to convert relative URLs to absolute
  function makeAbsoluteUrl(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url; // Already absolute
    }
    if (url.startsWith('/')) {
      return baseUrl + url; // Relative to root
    }
    return url; // Keep as-is for anchors (#) or other formats
  }

  let processed = content;

  // Remove import statements
  processed = processed.replace(/^import\s+.*$/gm, '');

  // Convert CustomCard components to markdown links
  processed = processed.replace(
    /<CustomCard[^>]*\s+title="([^"]*)"[^>]*\s+description="([^"]*)"[^>]*\s+href="([^"]*)"[^>]*\/>/g,
    (match, title, description, href) => {
      const absoluteUrl = makeAbsoluteUrl(href);
      return `- **[${title}](${absoluteUrl})**: ${description}`;
    }
  );

  // Convert Card components to markdown links
  processed = processed.replace(
    /<Card[^>]*\s+title="([^"]*)"[^>]*\s+href="([^"]*)"[^>]*\/>/g,
    (match, title, href) => {
      const absoluteUrl = makeAbsoluteUrl(href);
      return `- **[${title}](${absoluteUrl})**`;
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
    /<Callout[^>]*type="([^"]*)"[^>]*>([\s\S]*?)<\/Callout>/g,
    (match, type, content) => {
      const cleanContent = content.trim();
      const prefix = type === 'warning' ? '⚠️ ' : type === 'info' ? 'ℹ️ ' : '';
      return `> ${prefix}${cleanContent}`;
    }
  );

  // Convert simple HTML divs to text (remove div tags but keep content)
  processed = processed.replace(/<div[^>]*>([\s\S]*?)<\/div>/g, '$1');

  // Convert <br/> tags to line breaks
  processed = processed.replace(/<br\s*\/?>/g, '\n');

  // Convert Image components to markdown images (with alt)
  processed = processed.replace(
    /<Image[^>]*\s+src="([^"]*)"[^>]*\s+alt="([^"]*)"[^>]*\/?>/g,
    (match, src, alt) => {
      const absoluteUrl = makeAbsoluteUrl(src);
      return `![${alt}](${absoluteUrl})`;
    }
  );

  // Convert Image components to markdown images (without alt)
  processed = processed.replace(
    /<Image[^>]*\s+src="([^"]*)"[^>]*\/?>/g,
    (match, src) => {
      const absoluteUrl = makeAbsoluteUrl(src);
      return `![Image](${absoluteUrl})`;
    }
  );

  // Convert regular <img> tags to markdown images
  processed = processed.replace(
    /<img[^>]*\s+src="([^"]*)"[^>]*\s+alt="([^"]*)"[^>]*\/?>/g,
    (match, src, alt) => {
      const absoluteUrl = makeAbsoluteUrl(src);
      return `![${alt}](${absoluteUrl})`;
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

  // Convert regular markdown links to absolute URLs
  processed = processed.replace(
    /\[([^\]]*)\]\(([^)]*)\)/g,
    (match, text, href) => {
      const absoluteUrl = makeAbsoluteUrl(href);
      return `[${text}](${absoluteUrl})`;
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
