const fs = require("fs");
const path = require("path");
const { buildGitDates } = require("./lib/git-dates");

// Function to recursively get all MDX files
function getMdxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    // Skip hidden pages/directories (_temp, _providers, _meta.json, etc.)
    if (file.startsWith("_")) {
      return;
    }

    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getMdxFiles(filePath, fileList);
    } else if (file.endsWith(".mdx") || file.endsWith(".md")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to convert file path to URL
function getUrlFromPath(filePath, pagesDir) {
  // Get relative path from pages directory
  let relativePath = path.relative(pagesDir, filePath);

  // Remove .mdx/.md extension
  relativePath = relativePath.replace(/\.mdx?$/, "");

  // Convert Windows backslashes to forward slashes if needed
  relativePath = relativePath.split(path.sep).join("/");

  // Strip index segments (pages/index.mdx -> /, pages/foo/index.mdx -> /foo)
  relativePath = relativePath.replace(/(^|\/)index$/, "$1").replace(/\/$/, "");

  // Construct full URL (replace with your actual domain)
  return `https://docs.genlayer.com/${relativePath}`;
}

// Function to generate sitemap XML
function generateSitemapXml() {
  const pagesDir = path.join(process.cwd(), "pages");
  const outputDir = path.join(process.cwd(), "public");

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const mdxFiles = getMdxFiles(pagesDir);

  // Last-commit dates from git; mtime is meaningless on CI (= checkout time)
  const gitDates = buildGitDates();

  // Start XML content
  let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add each MDX file as a URL entry
  mdxFiles.forEach((filePath) => {
    const url = getUrlFromPath(filePath, pagesDir);
    const lastMod =
      gitDates[filePath] || new Date(fs.statSync(filePath).mtime).toISOString().slice(0, 10);

    xmlContent += `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  // Close XML content
  xmlContent += "\n</urlset>";

  // Write to sitemap.xml
  fs.writeFileSync(path.join(outputDir, "sitemap.xml"), xmlContent);
}

generateSitemapXml();
