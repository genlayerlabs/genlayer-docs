const fs = require("fs");
const path = require("path");

// Function to recursively get all MDX files
function getMdxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getMdxFiles(filePath, fileList);
    } else if (file.endsWith(".mdx")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Function to convert file path to URL
function getUrlFromPath(filePath, pagesDir) {
  // Get relative path from pages directory
  let relativePath = path.relative(pagesDir, filePath);

  // Remove .mdx extension
  relativePath = relativePath.replace(/\.mdx$/, "");

  // Replace index with empty string (for root-level pages)
  relativePath = relativePath === "index" ? "" : relativePath;

  // Convert Windows backslashes to forward slashes if needed
  relativePath = relativePath.split(path.sep).join("/");

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

  // Start XML content
  let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add each MDX file as a URL entry
  mdxFiles.forEach((filePath) => {
    const url = getUrlFromPath(filePath, pagesDir);
    // Get last modified time of the file
    const lastMod = new Date(fs.statSync(filePath).mtime).toISOString();

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
