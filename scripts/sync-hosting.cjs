const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');

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
    } else if (
      item.endsWith('.html') ||
      item.endsWith('.rsc') ||
      item.endsWith('.meta') ||
      item.endsWith('.txt') ||
      item.endsWith('.xml')
    ) {
      const cleanRel = rel.replace(/\([^\)]+\)[\\/]/g, '');
      const destPath = path.join(HOSTING_DIR, cleanRel);
      const parent = path.dirname(destPath);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.copyFileSync(fullPath, destPath);
    }
  }
}
copyHtmlFiles(NEXT_SERVER_APP_DIR);

// 4. Prerender all dynamic storefront routes (categories and products) so Firebase Hosting
// has physical .html and .rsc files for static serving without needing Cloud Functions SSR.
const PRERENDER_PORT = 5193;

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const ok = await new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/`, (res) => {
          resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
          req.destroy();
          resolve(false);
        });
      });
      if (ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function saveFile(destPath, content) {
  const parent = path.dirname(destPath);
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
}

function killProcessTree(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {}
}

async function prerenderDynamicRoutes() {
  console.log(`4. Spawning temporary Next.js server on port ${PRERENDER_PORT} to prerender dynamic routes...`);
  const server = spawn('npx next start -p ' + PRERENDER_PORT, { shell: true });

  const isReady = await waitForServer(PRERENDER_PORT);
  if (!isReady) {
    console.error('Failed to start temporary Next.js server for prerendering.');
    if (server.pid) killProcessTree(server.pid);
    return;
  }

  const categorySlugs = [
    'men',
    'menswear',
    'new-arrivals',
    'clothing',
    'collections',
    'sale',
    't-shirts',
    'shirts',
    'hoodies',
    'bottoms',
    'jackets',
    'urban-essentials',
    'premium-basics',
    'specialized-fabrics',
    'accessories',
  ];

  const productSlugs = [
    'shirt',
    'prod-1793939922857-2s6mie',
    'prod-1793944052304-597glu',
  ];

  console.log(`Prerendering ${categorySlugs.length} categories...`);
  for (const slug of categorySlugs) {
    try {
      const url = `http://localhost:${PRERENDER_PORT}/categories/${slug}`;
      const [htmlRes, rscRes] = await Promise.all([
        fetchUrl(url),
        fetchUrl(url, { RSC: '1' }),
      ]);

      if (htmlRes.statusCode === 200 && htmlRes.body) {
        saveFile(path.join(HOSTING_DIR, 'categories', `${slug}.html`), htmlRes.body);
        saveFile(path.join(HOSTING_DIR, 'categories', slug, 'index.html'), htmlRes.body);
      }
      if (rscRes.statusCode === 200 && rscRes.body) {
        saveFile(path.join(HOSTING_DIR, 'categories', `${slug}.rsc`), rscRes.body);
        saveFile(path.join(HOSTING_DIR, 'categories', slug, 'index.rsc'), rscRes.body);
      }
      console.log(`  ✓ /categories/${slug} (${htmlRes.statusCode})`);
    } catch (err) {
      console.warn(`  ✗ Failed to prerender /categories/${slug}:`, err.message);
    }
  }

  console.log(`Prerendering ${productSlugs.length} products...`);
  for (const slug of productSlugs) {
    try {
      const url = `http://localhost:${PRERENDER_PORT}/products/${slug}`;
      const [htmlRes, rscRes] = await Promise.all([
        fetchUrl(url),
        fetchUrl(url, { RSC: '1' }),
      ]);

      if (htmlRes.statusCode === 200 && htmlRes.body) {
        saveFile(path.join(HOSTING_DIR, 'products', `${slug}.html`), htmlRes.body);
        saveFile(path.join(HOSTING_DIR, 'products', slug, 'index.html'), htmlRes.body);
      }
      if (rscRes.statusCode === 200 && rscRes.body) {
        saveFile(path.join(HOSTING_DIR, 'products', `${slug}.rsc`), rscRes.body);
        saveFile(path.join(HOSTING_DIR, 'products', slug, 'index.rsc'), rscRes.body);
      }
      console.log(`  ✓ /products/${slug} (${htmlRes.statusCode})`);
    } catch (err) {
      console.warn(`  ✗ Failed to prerender /products/${slug}:`, err.message);
    }
  }

  if (server.pid) killProcessTree(server.pid);
  console.log('Temporary Next.js server shut down.');
}

prerenderDynamicRoutes()
  .then(() => {
    console.log('Hosting sync complete successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Hosting sync failed:', err);
    process.exit(1);
  });
