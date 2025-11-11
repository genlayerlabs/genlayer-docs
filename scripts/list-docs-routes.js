const fs = require('fs');
const path = require('path');

function parseMetaJson(dir) {
  const metaFilePath = path.join(dir, '_meta.json');
  if (fs.existsSync(metaFilePath)) {
    const metaContent = fs.readFileSync(metaFilePath, 'utf8');
    return JSON.parse(metaContent);
  }
  return null;
}

function shouldSkip(relativeDir) {
  if (!relativeDir) return false;
  const parts = relativeDir.split(path.sep);
  return parts.includes('api') || parts.includes('_providers') || parts.includes('_temp');
}

function collectRoutes(baseDir, currentDir = baseDir, basePath = '') {
  const routes = [];
  const relative = path.relative(baseDir, currentDir);
  if (shouldSkip(relative)) return routes;

  const meta = parseMetaJson(currentDir);
  if (!meta) return routes;

  for (const key of Object.keys(meta)) {
    const mdxPath = path.join(currentDir, `${key}.mdx`);
    const cmdxPath = path.join(currentDir, `${key}.cmdx`);
    const subDir = path.join(currentDir, key);

    if (fs.existsSync(mdxPath) || fs.existsSync(cmdxPath)) {
      const route = key === 'index' ? (basePath || '/') : path.posix.join(basePath || '/', key);
      routes.push(route);
    }

    if (fs.existsSync(subDir) && fs.statSync(subDir).isDirectory()) {
      const nextBasePath = key === 'index' ? (basePath || '/') : path.posix.join(basePath || '/', key);
      routes.push(...collectRoutes(baseDir, subDir, nextBasePath));
    }
  }

  return Array.from(new Set(routes));
}

function listDocsRoutes() {
  const pagesDir = path.join(process.cwd(), 'pages');
  return collectRoutes(pagesDir);
}

if (require.main === module) {
  // Print for manual inspection
  console.log(JSON.stringify(listDocsRoutes(), null, 2));
} else {
  module.exports = { listDocsRoutes };
}


