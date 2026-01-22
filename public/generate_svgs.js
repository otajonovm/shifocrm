import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlFile = path.join(__dirname, '..', 'index.html'); // Siz yuklagan fayl nomi
const outputDir = path.join(__dirname, 'teeth', 'individual');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const content = fs.readFileSync(htmlFile, 'utf8');

// Tish raqami va SVG kodini ajratib olish uchun regex
const regex = /class="[^"]*tooth-(\d+)[^"]*"[\s\S]*?<svg([\s\S]*?)<\/svg>/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const toothNum = match[1];
    const svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 55 100" width="55">${match[2]}</svg>`;
    
    fs.writeFileSync(path.join(outputDir, `tooth-${toothNum}.svg`), svgCode);
    console.log(`Tayyorlandi: tooth-${toothNum}.svg`);
}