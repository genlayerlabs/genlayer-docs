const fs = require('fs');
const path = require('path');

// Function to recursively get all MDX files
function getMdxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getMdxFiles(filePath, fileList);
    } else if (file.endsWith('.mdx')) {
      fileList.push(filePath);
    }
  });
  
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