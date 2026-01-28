# ShifoCRM vs raqobatchi ($93/oy) — imkoniyatlar solishtiruvi

Raqobatchining ~$93 beradigan paketidagi barcha bandlar ShifoCRM bilan qanday mos kelishi jadvalda.

| № | Raqobatchi imkoniyati | Raqobatchi | ShifoCRM | Izoh |
|---|------------------------|------------|----------|------|
| **Limitlar va tarif** |
| 1 | **Sinov muddati** | 3 kun | ❌ Yo'q | Tizimda trial/sinov mantiqi yo'q |
| 2 | **Doktorlar soni** | 5 ta | ⚠️ 4 ta | `doctors` store: `items.length >= 4` cheklovi |
| 3 | **Administratorlar** | Cheksiz | ⚠️ 1 ta | Bitta admin (`db.json`), ko'p admin yo'q |
| 4 | **Disk maydoni** | 50 GB | ➖ Belgilanmagan | Supabase o'z limitlari; alohida 50 GB ko'rsatilmaydi |
| **Asosiy modullar** |
| 5 | **Doktorlar jadvali** (Расписание врачей) | ✅ | ✅ | Doktor profilida haftalik ish jadvali (kunlar, vaqt, tanaffus) |
| 6 | **Bemorlar bazasi** (База пациентов) | ✅ | ✅ | Bemorlar CRUD, filtrlash, profil, odontogramma |
| 7 | **Davolash shablonlari** (Шаблоны лечений) | ✅ | ✅ | Davolash rejalari (treatment plans): reja, bemor, sana, prioritet, tish, narx |
| 8 | **Prays-list** (Прайс лист) | ✅ | ✅ | Xizmatlar: narx, kategoriya, davomiylik; paketlar; chegirmalar; audit |
| 9 | **Ombor / Sklad** (+$13) | ✅ | ✅ | Materiallar, kirim/chiqim, xarajatlar (`inventory` moduli) |
| 10 | **Buxgalteriya va moliya** | ✅ | ✅ | To'lovlar (payment/refund/adjustment), usullar, visit bilan bog'lash |
| 11 | **Hisobotlar** (Отчёты) | ✅ | ✅ | To'lov usullari, doktor daromadi, qarzdorlar, top xizmatlar, kunlik/oylik |
| 12 | **CRM** (+$13) | ✅ | ✅ | Bemorlar, uchrashuvlar, to'lovlar, xizmatlar — asosiy CRM |
| **Qo'shimcha** |
| 13 | **Marketing** | ✅ | ❌ Yo'q | Alohida marketing moduli yo'q |
| 14 | **Onlayn yozilish** (Онлайн-запись) | ✅ | ❌ Yo'q | Faqat "pending" = "onlayn yozilgan" statusi; bemor uchun ochiq onlayn yozilish formasi/widget yo'q |
| 15 | **Bemorlarga bildirishnoma (bildirishnoma)** | ✅ | ❌ Yo'q | Headerda faqat bell ikonkasi; SMS/email/messenger orqali yuborish yo'q |
| 16 | **WhatsApp / Telegram / Max** ($31) | ✅ | ❌ Yo'q | Integratsiya yo'q |
| 17 | **Telegram Bot / Max Bot** (0$ … 01.03.2026) | ✅ | ❌ Yo'q | Bot yo'q |
| 18 | **API for AMO CRM** | ✅ | ❌ Yo'q | AMO CRM uchun tashqi API / webhook yo'q; faqat Supabase REST |
| 19 | **YeGIZ (RF)** | ✅ | ➖ N/A | Rossiya tibbiy tizimi; O'zbekiston loyihasiga tatbiq emas |

---

## Qisqacha xulosa

**ShifoCRMda bor (raqobatchiga yaqin):**

- Doktorlar jadvali (ish vaqti, tanaffus)
- Bemorlar bazasi va profil
- Davolash rejalari (shablonlar)
- Prays-list (xizmatlar, paketlar, chegirmalar)
- Ombor (materiallar, kirim/chiqim, xarajatlar)
- Buxgalteriya va moliya (to'lovlar)
- Hisobotlar
- Asosiy CRM (bemorlar, uchrashuvlar, to'lovlar, xizmatlar)

**ShifoCRMda yo'q yoki cheklangan:**

- Sinov muddati (3 kun)
- Doktorlar: 4 ta (ular 5)
- Administratorlar: 1 ta (ular cheksiz)
- Disk 50 GB — alohida ko'rsatilmaydi
- Marketing moduli
- Onlayn yozilish (bemor uchun ochiq forma)
- Bemorlarga bildirishnoma (SMS / email / messenger)
- WhatsApp, Telegram, Max, botlar
- AMO CRM uchun API
- YeGIZ — O'zbekiston uchun muhim emas

---

## Taklif etiladigan keyingi qadamlar

1. **Doktorlar limiti**: 4 → 5 qilish (config/store).
2. **Sinov muddati**: 3 kunlik trial mantiqini qo'shish (auth/store).
3. **Ko'p admin**: adminlar jadvali va role-based kirish.
4. **Onlayn yozilish**: bemorlar uchun ochiq sahifa/widget (sana va vaqt tanlash, "Yozilish" tugmasi).
5. **Bildirishnomalar**: SMS yoki email (keyin Telegram/WhatsApp) — eslatma, tasdiq, qoldirish.
6. **Marketing**: SMS/email kampaniyalar, shablonlar (ixtiyoriy).

Agar xohlasangiz, yuqoridagi bandlar bo'yicha aniq implementation rejasi (fayllar, API, UI) ni bosqichma-bosqich yozib beraman.

---

## Narx taklifi (qancha aytish mumkin)

Hozirgi keltiradigan foydalarimiz (CRM, bemorlar, uchrashuvlar, to'lovlar, xizmatlar, ombor, hisobotlar, doktor jadvali, davolash rejalari) va raqobatchi ($93/oy) bilan solishtirganda quyidagilarni aytish mumkin.

### Asosiy taklif

| Variant | Oylik narx | Izoh |
|--------|------------|------|
| **Minimal** | **$39–45** | "Raqobatchidan 50% arzon, asosiy klinika modullari bor" — juda agressiv narx |
| **Tavsiya** | **$49–59** | Raqobatchi $93 dan 35–40% arzon; imkoniyatlar 70–80% yaqin. Aytish uchun eng mantiqli diapazon |
| **Maksimal** | **$65–75** | Ombor ularda +$13, CRM +$13 — bizda ikkalasi kiritilgan deb olib, biroz yuqoriroq olish mumkin |

**Qisqacha:** **$49–59/oy** yoki **~$55/oy** aytish eng muvozanadli — ham arzon, ham "to'liq" CRM hissi.

### Nima uchun $93 emas?

- Sinov muddati, ko'p admin, onlayn yozilish, Telegram/WhatsApp, marketing yo'q.
- Doktorlar 4 ta (ular 5), admin 1 ta.
- Shuning uchun $93 tenglashtirib aytish qiyin; **$55 atrofida** ancha ishonchli.

### Yillik to'lov

- **Oylik**: $55 × 12 = $660/yl.
- **Yillik (2 oy "bepul")**: $55 × 10 = **$550/yl** — ~17% chegirma, mijozlar uchun jozibador.

### So'mda (taxminiy, 1 USD ≈ 12 500 UZS)

| Tarif | Oylik (USD) | Oylik (UZS) | Yillik (UZS) |
|-------|-------------|-------------|--------------|
| $49   | $49         | ~612 000    | ~7,35 mln    |
| $55   | $55         | ~687 500    | ~8,25 mln    |
| $59   | $59         | ~737 500    | ~8,85 mln    |

### Kelajakda qo'shilsa

- Onlayn yozilish + bildirishnomalar (SMS/Telegram): **+$10–15/oy** yoki Premium paket **$69–79/oy**.
- API (AMO va boshqalar): **+$15–20/oy** yoki alohida enterprise narx.

**Xulosa:** hozirgi foydalar uchun **$49–59/oy** (~$55) aytish mumkin; yillikda 2 oy "bepul" bersangiz, **$550/yl** maqul.
