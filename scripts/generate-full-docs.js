const fs = require('fs');
const path = require('path');

// Function to read and parse _meta.json files
function parseMetaJson(dir) {
  const metaFilePath = path.join(dir, '_meta.json');
  if (fs.existsSync(metaFilePath)) {
    const metaContent = fs.readFileSync(metaFilePath, 'utf8');
    return JSON.parse(metaContent);
  }
  return null;
}

// Function to recursively get all MDX files
function getMdxFiles(baseDir, fileList = []) {
  function traverseDirectory(dir) {
    const meta = parseMetaJson(dir);
    if (meta) {
      Object.keys(meta).forEach(key => {
        const mdxPath = path.join(dir, `${key}.mdx`);
        if (fs.existsSync(mdxPath)) {
          fileList.push(mdxPath);
        }

        const subDir = path.join(dir, key);
        if (fs.existsSync(subDir) && fs.statSync(subDir).isDirectory()) {
          traverseDirectory(subDir);
        }
      });
    }
  }

  traverseDirectory(baseDir);
  return fileList;
}

// Main function
function generateFullDocs() {
  const pagesDir = path.join(process.cwd(), 'pages');
  const outputDir = path.join(process.cwd(), 'public');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const mdxFiles = getMdxFiles(pagesDir);
  let fullContent = '';
  
  mdxFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(pagesDir, filePath);
    
    fullContent += `\n\n# ${relativePath}\n\n${content}`;
  });
  
  fs.writeFileSync(path.join(outputDir, 'full-documentation.txt'), fullContent);
}

generateFullDocs();