/**
 * PWA Icon Generator Script
 * Run: node scripts/generate-pwa-icons.js
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// SVG logo with medical theme - ShifoCRM
const createSvgLogo = (size, padding = 0) => {
  const innerSize = size - padding * 2;
  const center = size / 2;
  const radius = innerSize * 0.4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0284c7;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- White background -->
  <rect width="${size}" height="${size}" fill="#ffffff"/>
  <!-- Gradient circle -->
  <circle cx="${center}" cy="${center}" r="${radius}" fill="url(#grad)"/>
  <!-- Medical cross -->
  <rect x="${center - radius * 0.15}" y="${center - radius * 0.5}" width="${radius * 0.3}" height="${radius}" rx="${radius * 0.05}" fill="#ffffff"/>
  <rect x="${center - radius * 0.5}" y="${center - radius * 0.15}" width="${radius}" height="${radius * 0.3}" rx="${radius * 0.05}" fill="#ffffff"/>
  <!-- Heart accent -->
  <path d="M${center} ${center + radius * 0.35}
    C${center - radius * 0.15} ${center + radius * 0.2} ${center - radius * 0.35} ${center + radius * 0.35} ${center - radius * 0.35} ${center + radius * 0.5}
    C${center - radius * 0.35} ${center + radius * 0.65} ${center} ${center + radius * 0.8} ${center} ${center + radius * 0.8}
    C${center} ${center + radius * 0.8} ${center + radius * 0.35} ${center + radius * 0.65} ${center + radius * 0.35} ${center + radius * 0.5}
    C${center + radius * 0.35} ${center + radius * 0.35} ${center + radius * 0.15} ${center + radius * 0.2} ${center} ${center + radius * 0.35}Z"
    fill="#ef4444" opacity="0.9"/>
</svg>`;
};

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');

  // Ensure public directory exists
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  const sizes = [
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-16x16.png', size: 16 },
  ];

  for (const { name, size } of sizes) {
    const svg = createSvgLogo(size, size * 0.1); // 10% padding for maskable
    const pngBuffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    const outputPath = join(publicDir, name);
    writeFileSync(outputPath, pngBuffer);
    console.log(`✅ Created: ${name}`);
  }

  // Create favicon.ico (use 32x32 as base)
  const faviconSvg = createSvgLogo(32, 2);
  const faviconBuffer = await sharp(Buffer.from(faviconSvg))
    .png()
    .toBuffer();
  writeFileSync(join(publicDir, 'favicon.ico'), faviconBuffer);
  console.log('✅ Created: favicon.ico');

  console.log('\n🎉 All PWA icons generated successfully!');
}

generateIcons().catch(console.error);
