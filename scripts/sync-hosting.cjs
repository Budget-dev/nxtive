const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HOSTING_DIR = path.join(ROOT, '.firebase', 'nxtive-80349', 'hosting');
const PUBLIC_DIR = path.join(ROOT, 'public');
const NEXT_STATIC_DIR = path.join(ROOT, '.next', 'static');
const NEXT_SERVER_APP_DIR = path.join(ROOT, '.next', 'server', 'app');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('1. Copying public assets to hosting folder...');
copyRecursive(PUBLIC_DIR, HOSTING_DIR);

console.log('2. Copying .next/static to _next/static...');
copyRecursive(NEXT_STATIC_DIR, path.join(HOSTING_DIR, '_next', 'static'));

console.log('3. Copying generated HTML and route files...');
function copyHtmlFiles(dir, relativePath = '') {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const rel = path.join(relativePath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      copyHtmlFiles(fullPath, rel);
    } else if (item.endsWith('.html') || item.endsWith('.rsc') || item.endsWith('.meta') || item.endsWith('.txt') || item.endsWith('.xml')) {
      const cleanRel = rel.replace(/\([^\)]+\)[\\/]/g, '');
      const destPath = path.join(HOSTING_DIR, cleanRel);
      const parent = path.dirname(destPath);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.copyFileSync(fullPath, destPath);
    }
  }
}
copyHtmlFiles(NEXT_SERVER_APP_DIR);
console.log('Hosting sync complete successfully!');
