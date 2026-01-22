# Tishlar SVG Fayllari
# Teeth SVG Files

## 📁 Fayl Nomlanishi

32 ta tishning SVG fayllari quyidagi nomlar bilan saqlanishi kerak:

### Yuqori Jag' (Upper Jaw)

**O'ng tomon (Right):**
- `18.svg` - 3-molar (wisdom tooth)
- `17.svg` - 2-molar
- `16.svg` - 1-molar
- `15.svg` - 2-premolar
- `14.svg` - 1-premolar
- `13.svg` - Kuchik
- `12.svg` - Lateral incisor
- `11.svg` - Central incisor

**Chap tomon (Left):**
- `21.svg` - Central incisor
- `22.svg` - Lateral incisor
- `23.svg` - Kuchik
- `24.svg` - 1-premolar
- `25.svg` - 2-premolar
- `26.svg` - 1-molar
- `27.svg` - 2-molar
- `28.svg` - 3-molar (wisdom tooth)

### Pastki Jag' (Lower Jaw)

**Chap tomon (Left):**
- `31.svg` - Central incisor
- `32.svg` - Lateral incisor
- `33.svg` - Kuchik
- `34.svg` - 1-premolar
- `35.svg` - 2-premolar
- `36.svg` - 1-molar
- `37.svg` - 2-molar
- `38.svg` - 3-molar (wisdom tooth)

**O'ng tomon (Right):**
- `41.svg` - Central incisor
- `42.svg` - Lateral incisor
- `43.svg` - Kuchik
- `44.svg` - 1-premolar
- `45.svg` - 2-premolar
- `46.svg` - 1-molar
- `47.svg` - 2-molar
- `48.svg` - 3-molar (wisdom tooth)

## 📋 Fayl Strukturasi

```
public/
└── teeth/
    ├── 11.svg
    ├── 12.svg
    ├── 13.svg
    ├── 14.svg
    ├── 15.svg
    ├── 16.svg
    ├── 17.svg
    ├── 18.svg
    ├── 21.svg
    ├── 22.svg
    ├── 23.svg
    ├── 24.svg
    ├── 25.svg
    ├── 26.svg
    ├── 27.svg
    ├── 28.svg
    ├── 31.svg
    ├── 32.svg
    ├── 33.svg
    ├── 34.svg
    ├── 35.svg
    ├── 36.svg
    ├── 37.svg
    ├── 38.svg
    ├── 41.svg
    ├── 42.svg
    ├── 43.svg
    ├── 44.svg
    ├── 45.svg
    ├── 46.svg
    ├── 47.svg
    ├── 48.svg
    └── README.md
```

## 🎨 SVG Talablar

- **Format:** SVG (Scalable Vector Graphics)
- **O'lcham:** Ixtiyoriy (komponent avtomatik resize qiladi)
- **Rang:** SVG ichida ranglar bo'lishi mumkin, lekin komponent CSS orqali rang o'zgartira oladi
- **ViewBox:** Tavsiya etiladi (masalan: `viewBox="0 0 100 100"`)

## 📝 Misol SVG Strukturasi

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Tish shakli -->
  <path d="..." fill="currentColor" stroke="#000" stroke-width="2"/>
</svg>
```

## ✅ Tekshirish

Fayllarni qo'yganingizdan keyin, quyidagi URL'lar ishlashi kerak:
- `/teeth/11.svg`
- `/teeth/12.svg`
- ...
- `/teeth/48.svg`

---

**Eslatma:** Agar SVG fayllar boshqa nom bilan bo'lsa, `src/components/patients/PatientOdontogram.vue` faylida path'ni o'zgartirishingiz kerak bo'ladi.
