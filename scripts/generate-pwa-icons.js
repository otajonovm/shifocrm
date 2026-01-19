/* eslint-disable no-undef */


import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');

// Check for custom logo in different formats
const logoFormats = ['logo.png', 'logo.jpg', 'logo.jpeg'];
let customLogoPath = null;
for (const format of logoFormats) {
  const path = join(publicDir, format);
  if (existsSync(path)) {
    customLogoPath = path;
    break;
  }
}
const hasCustomLogo = customLogoPath !== null;

const createSvgLogo = (size) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <!-- White background with padding for maskable icon -->
  <rect width="512" height="512" fill="#ffffff"/>

  <!-- Blue heart outline -->
  <path d="M256 420
    C256 420 80 280 80 170
    C80 100 130 55 195 55
    C235 55 256 85 256 85
    C256 85 277 55 317 55
    C382 55 432 100 432 170
    C432 280 256 420 256 420 Z"
    fill="none"
    stroke="#1e4b8e"
    stroke-width="32"
    stroke-linecap="round"
    stroke-linejoin="round"/>

  <!-- Green person figure -->
  <!-- Head -->
  <circle cx="256" cy="175" r="32" fill="#2eaa5a"/>

  <path d="M256 207 L256 320"
    fill="none"
    stroke="#2eaa5a"
    stroke-width="28"
    stroke-linecap="round"/>

  <!-- Arms spreading outward -->
  <path d="M150 230 Q200 200 256 230 Q312 200 362 230"
    fill="none"
    stroke="#2eaa5a"
    stroke-width="28"
    stroke-linecap="round"
    stroke-linejoin="round"/>
</svg>`;
};

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');

  if (hasCustomLogo) {
    console.log(`📷 Custom logo found: ${customLogoPath}`);
  } else {
    console.log('ℹ️  No custom logo found, using ShifoCRM default SVG');
  }

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
    let pngBuffer;

    if (hasCustomLogo) {
      // Resize custom logo
      pngBuffer = await sharp(customLogoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();
    } else {
      // Use default SVG
      const svg = createSvgLogo(512);
      pngBuffer = await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toBuffer();
    }

    const outputPath = join(publicDir, name);
    writeFileSync(outputPath, pngBuffer);
    console.log(`✅ Created: ${name}`);
  }

  // Create favicon.ico
  let faviconBuffer;
  if (hasCustomLogo) {
    faviconBuffer = await sharp(customLogoPath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toBuffer();
  } else {
    const svg = createSvgLogo(512);
    faviconBuffer = await sharp(Buffer.from(svg))
      .resize(32, 32)
      .png()
      .toBuffer();
  }
  writeFileSync(join(publicDir, 'favicon.ico'), faviconBuffer);
  console.log('✅ Created: favicon.ico');

  // Also save SVG version
  if (!hasCustomLogo) {
    const svg = createSvgLogo(512);
    writeFileSync(join(publicDir, 'logo.svg'), svg);
    console.log('✅ Created: logo.svg');
  }

  console.log('\n🎉 All PWA icons generated successfully!');
  console.log('   Colors: Blue #1e4b8e, Green #2eaa5a');
}

generateIcons().catch(console.error);
