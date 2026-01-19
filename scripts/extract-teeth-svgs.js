const fs = require('fs');
const path = require('path');

// HTML fayl manzili
const htmlFilePath = 'c:\\Users\\Администратор\\Desktop\\tishlar\\index.html';
const outputDir = path.join(__dirname, '..', 'public', 'teeth');

// Output papkasini yaratish
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// HTML faylni o'qish
console.log('HTML faylni o\'qiyapman...');
const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');

// Tishlar ro'yxati (FDI notation: 11-18, 21-28, 31-38, 41-48)
const teethNumbers = [];
for (let i = 11; i <= 18; i++) teethNumbers.push(i);
for (let i = 21; i <= 28; i++) teethNumbers.push(i);
for (let i = 31; i <= 38; i++) teethNumbers.push(i);
for (let i = 41; i <= 48; i++) teethNumbers.push(i);

console.log(`Jami ${teethNumbers.length} ta tish uchun SVG fayllar yaratilmoqda...`);

let extractedCount = 0;

// Har bir tish uchun SVG kodini ajratib olish
teethNumbers.forEach(toothNum => {
  // Tish uchun regex pattern
  const toothClassPattern = new RegExp(
    `class="[^"]*tooth-${toothNum}[^"]*"`,
    'i'
  );
  
  // Tish bo'limini topish
  const toothMatch = htmlContent.match(
    new RegExp(
      `<div[^>]*class="[^"]*tooth-${toothNum}[^"]*"[^>]*>([\\s\\S]*?)<\\/div>\\s*<\\/div>\\s*<\\/div>`,
      'i'
    )
  );
  
  if (!toothMatch) {
    console.log(`⚠️  Tish ${toothNum} topilmadi`);
    return;
  }
  
  const toothSection = toothMatch[0];
  
  // SVG kodini topish (tooth-content ichida)
  const svgMatch = toothSection.match(
    /<svg[^>]*>([\s\S]*?)<\/svg>/i
  );
  
  if (!svgMatch) {
    console.log(`⚠️  Tish ${toothNum} uchun SVG topilmadi`);
    return;
  }
  
  let svgContent = svgMatch[0];
  
  // SVG atributlarini tozalash va to'ldirish
  // viewBox va xmlns qo'shish agar yo'q bo'lsa
  if (!svgContent.includes('viewBox')) {
    // viewBox ni SVG ichidan topish yoki default qo'yish
    const viewBoxMatch = svgContent.match(/viewBox="([^"]*)"/i);
    if (!viewBoxMatch) {
      svgContent = svgContent.replace(
        /<svg([^>]*)>/i,
        '<svg$1 viewBox="0 0 55 100">'
      );
    }
  }
  
  if (!svgContent.includes('xmlns')) {
    svgContent = svgContent.replace(
      /<svg([^>]*)>/i,
      '<svg$1 xmlns="http://www.w3.org/2000/svg">'
    );
  }
  
  // data-v-* atributlarini olib tashlash
  svgContent = svgContent.replace(/\s+data-v-[^=]*="[^"]*"/g, '');
  
  // SVG faylini saqlash
  const outputPath = path.join(outputDir, `tooth-${toothNum}.svg`);
  fs.writeFileSync(outputPath, svgContent, 'utf-8');
  
  console.log(`✅ Tish ${toothNum} SVG fayli yaratildi: ${outputPath}`);
  extractedCount++;
});

console.log(`\n✅ Jami ${extractedCount} ta SVG fayl yaratildi!`);
console.log(`📁 Fayllar: ${outputDir}`);
