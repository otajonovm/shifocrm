# ShifoCRM loyihasi kitobchasi (foydalanuvchi qo'llanma)

Ushbu hujjat ShifoCRM tizimidagi barcha asosiy bo'limlar va rollar bo'yicha
qanday ishlash kerakligini aniq va tushunarli tarzda tushuntiradi.

## 1. Rollar va kirish huquqlari

Tizimda 2 ta rol mavjud:

- **Admin**: barcha modullarga kirish huquqi bor.
- **Doctor**: faqat shaxsiy bemorlar, uchrashuvlar, davolash rejasi va profil.

### Admin menyu bo'limlari
- Dashboard
- Bemorlar
- Doktorlar
- Uchrashuvlar
- To'lovlar
- Xizmatlar
- Ombor
- Hisobotlar
- Sozlamalar

### Doctor menyu bo'limlari
- Dashboard
- Mening bemorlarim
- Mening uchrashuvlarim
- Davolash rejalari
- Profil (doktor profili)

## 2. Tizimga kirish (Login)

Login sahifasida ikki taba mavjud: **Admin** va **Doctor**.

### Admin login
1. Login sahifasida **Admin** tabini tanlang.
2. Login va parolni kiriting.
3. **Kirish** tugmasini bosing.

Admin uchun login ma'lumotlari `db.json` faylida saqlanadi.
Amaliyotda bu ma'lumotlar faqat adminlarda bo'lishi kerak.

### Doctor login
1. Login sahifasida **Doctor** tabini tanlang.
2. Email va parolni kiriting.
3. **Kirish** tugmasini bosing.

Doctor akkaunti **Admin** tomonidan `Doktorlar` bo'limida yaratiladi.

### Tizimdan chiqish (Logout)
O'ng yuqori menyudan chiqish tugmasini bosing yoki sidebar pastidagi chiqish
ikonkasini bosing.

## 3. Asosiy interfeys (Layout)

### Sidebar
Chap tomonda rolga mos menyular ko'rsatiladi.

### Header
- **Qidiruv**: faqat adminlarda.
- **Bildirishnomalar**: belgi orqali ko'rinadi.
- **Profil menyusi**: profil, sozlamalar va chiqish.

## 4. Dashboard

### Admin Dashboard
Asosiy bloklar:
- **Tushum (Revenue)**: kun/hafta/oy kesimida.
- **Qarzdorlik**: umumiy qarz va top 3 qarzdor.
- **Bugungi uchrashuvlar**: jadval va statuslar.
- **Tezkor tugmalar**: yangi bemor, uchrashuv va to'lov.

### Doctor Dashboard
Asosiy bloklar:
- **Xush kelibsiz banneri** va vaqt.
- **Keyingi bemor**: tezkor boshlash.
- **Quick Actions**: uchrashuv, rejalar, qabulni boshlash.
- **Bugungi jadval**: timeline ko'rinishida.
- **Bugungi rejalar**: reja -> tashrifga aylantirish, bajarilgan belgilash.
- **Mening bemorlarim**: statistik ko'rsatkich.

## 5. Bemorlar bo'limi

### Admin (Barcha bemorlar)
Funksiyalar:
- Qidirish, status bo'yicha filtrlash, doktor bo'yicha filtrlash.
- Eksport qilish.
- Yangi bemor qo'shish, tahrirlash va o'chirish.

### Doctor (Mening bemorlarim)
Doctor faqat o'z bemorlarini ko'radi va ular bo'yicha ishlaydi.

### Bemor profili (Patient Detail)
Bemor kartasi tarkibi:
- Ism, ID, telefon, balans, doktor, oxirgi tashrif.
- Qarzdorlik banneri (agar qarz bo'lsa).

Tablar:
- **Tashriflar**: bemorning tashriflari.
- **Odontogramma**: tishlar holati.
- **To'lovlar**: to'lovlar ko'rinishi.
- **Davolash rejasi**: bemor rejalari.
- **Hujjatlar**: hujjatlar bo'limi.

Adminlar bemor statusini o'zgartira oladi.

## 6. Doktorlar bo'limi (Admin)

Doktor qo'shish formasi orqali quyidagilar kiritiladi:
- F.I.O.
- Telefon
- Email
- Parol
- Mutaxassislik
- Faollik (active)

Cheklov: maksimal 4 ta doktor.

Doktorlar jadvalida tahrirlash va o'chirish mavjud.

## 7. Uchrashuvlar bo'limi

Admin va doctor uchun bir xil ko'rinish:
- Kun/hafta/oy ko'rinishi.
- Sana bo'yicha tez o'tish.
- Qidiruv va filtrlash (doktor, status, xizmat, to'lov holati).
- Bulk actions: status o'zgartirish, reschedule, doktor almashtirish (admin).
- **Bemorga o'tish**: bemor ismini bosish yoki "Bemorga o'tish" tugmasi orqali bemor kartasiga (tarix, to'lovlar, reja va h.k.) o'tish mumkin.

### Uchrashuv statuslari
Statuslar va tartib:
- **pending**: Yozildi
- **arrived**: Keldi
- **in_progress**: Davolanish boshlandi
- **completed_debt**: Qarzdor
- **completed_paid**: Yakunlandi
- **cancelled**: Bekor qilingan
- **no_show**: Kelmagan
- **archived**: Arxivlangan

Muhim qoida:
`completed_debt` -> `completed_paid` faqat qarzdorlik 0 bo'lsa.

## 8. To'lovlar bo'limi (Admin)

Asosiy imkoniyatlar:
- Umumiy to'lovlar, refund va sof daromad ko'rsatkichlari.
- Filtrlar: sana, bemor, doktor, to'lov turi, to'lov usuli.
- To'lovlar ro'yxati va CRUD (qo'shish, tahrirlash, o'chirish).

To'lov turlari:
- payment, refund, adjustment

To'lov usullari:
- cash, card, transfer

## 9. Xizmatlar bo'limi (Admin)

Bo'limlar:
- **Xizmatlar**: xizmatlar ro'yxati, narx, status.
- **Paketlar**: paket xizmatlar.
- **Chegirmalar**: chegirma qoidalari.
- **Audit**: narx o'zgarishi loglari.
- **Statistika**: top xizmatlar va daromad.

## 10. Ombor bo'limi (Admin)

Tablar:
- **Materiallar**: materiallar ro'yxati va qoldiq.
- **Kirim/Chiqim**: ombor harakati (in/out).
- **Harajatlar**: ombor xarajatlari.

CRUD amallari modallar orqali bajariladi.

## 11. Hisobotlar bo'limi (Admin)

Filtrlar:
- Sana oralig'i

Ko'rsatkichlar:
- Umumiy to'lovlar, refund, sof daromad, umumiy qarz.
- To'lov usullari bo'yicha statistikalar.
- Doktorlar bo'yicha daromad.
- Qarzdorlar ro'yxati.
- Eng ko'p tushumli xizmatlar.
- Oylik xizmat daromadi.
- Kunlik daromad grafigi.

## 12. Davolash rejalari (Doctor)

Funksiyalar:
- Reja yaratish (bemor, sana, status, prioritet, tish, narx).
- Rejalarni filtrlash.
- Rejani tashrifga aylantirish.
- Rejani bajarilgan/deferred/cancel holatlariga o'tkazish.

## 13. Doktor profili (Doctor)

Bo'limlar:
- Shaxsiy ma'lumotlar: F.I.O, telefon, mutaxassislik.
- Ish jadvali: haftalik ish vaqti, tanaffus.
- Parolni o'zgartirish.

## 14. Sozlamalar

**Til:** O'zbekcha, Русский.

**Klinika logotipi:** Admin yoki shifokor Sozlamalar → "Klinika logotipi" orqali klinika logotipini yuklashi mumkin. Logo **Login** sahifasida va **sidebar**da ko'rinadi. Shifokorlar tizimni "o'zlariniki" deb qabul qiladi. "Olib tashlash" bilan default ShifoCRM ko'rinishiga qaytadi. Logo hozircha brauzer (localStorage) da saqlanadi — boshqa qurilma yoki brauzerda ko'rinmaydi; kelajakda Supabase orqali klinika bo'yicha saqlash mumkin.

## 15. Tezkor maslahatlar

- Har bir jadvalda filtrlardan foydalanib ma'lumotlarni tez toping.
- Adminlar qarzdorlar bo'limini kuzatib boring.
- Doctorlar davolash rejasini vaqtida yangilab boring.
- Uchrashuv statuslarini to'g'ri yuritish hisobotlarga bevosita ta'sir qiladi.

---

Agar qo'shimcha bo'limlar yoki batafsil texnik dokument kerak bo'lsa,
alohida so'rang.
