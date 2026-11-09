const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

let totalOriginal = 0;
let totalOptimized = 0;
let fileCount = 0;

async function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDir(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg') {
        const fileBuffer = fs.readFileSync(fullPath);
        const origSize = fileBuffer.length;
        totalOriginal += origSize;

        const isBanner = /banner|hero|cinematic/i.test(fullPath);
        const maxW = isBanner ? 1200 : 640;

        try {
          const buf = await sharp(fileBuffer)
            .resize({ width: maxW, withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toBuffer();

          fs.writeFileSync(fullPath, buf);
          totalOptimized += buf.length;
          fileCount++;
          console.log(`[JPEG] ${path.relative('public', fullPath)}: ${(origSize/1024).toFixed(0)}KB -> ${(buf.length/1024).toFixed(0)}KB`);
        } catch(e) {
          console.error(`Failed ${fullPath}:`, e.message);
          totalOptimized += origSize;
        }
      } else if (ext === '.png') {
        const fileBuffer = fs.readFileSync(fullPath);
        const origSize = fileBuffer.length;
        totalOriginal += origSize;

        try {
          const buf = await sharp(fileBuffer)
            .resize({ width: 400, withoutEnlargement: true })
            .png({ quality: 85, compressionLevel: 9 })
            .toBuffer();

          fs.writeFileSync(fullPath, buf);
          totalOptimized += buf.length;
          fileCount++;
          console.log(`[PNG] ${path.relative('public', fullPath)}: ${(origSize/1024).toFixed(0)}KB -> ${(buf.length/1024).toFixed(0)}KB`);
        } catch(e) {
          console.error(`Failed ${fullPath}:`, e.message);
          totalOptimized += origSize;
        }
      }
    }
  }
}

async function run() {
  console.log('Optimizing images in public/images...');
  await processDir(path.resolve('public/images'));
  console.log('=== OPTIMIZATION SUMMARY ===');
  console.log(`Files optimized: ${fileCount}`);
  console.log(`Original size: ${(totalOriginal / (1024*1024)).toFixed(2)} MB`);
  console.log(`Optimized size: ${(totalOptimized / (1024*1024)).toFixed(2)} MB`);
  console.log(`Bandwidth Saved: ${((totalOriginal - totalOptimized) / (1024*1024)).toFixed(2)} MB (${(((totalOriginal - totalOptimized)/totalOriginal)*100).toFixed(1)}%)`);
}

run();
