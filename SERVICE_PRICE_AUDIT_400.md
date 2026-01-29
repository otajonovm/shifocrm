# service_price_audit 400 (Bad Request) — sabablari

## Nima bo‘lyapti?

Brauzer quyidagi so‘rovni yuboradi:

```
GET .../rest/v1/service_price_audit?clinic_id=eq.10&order=changed_at.desc&limit=50
→ 400 (Bad Request)
```

## Sabablar (Supabase tomonda)

400 **Supabase REST API** jadval yoki ustun so‘rovda ishlatilgani bilan mos kelmasa qaytaradi. Sizdagi holatda ehtimol sabablar:

1. **`service_price_audit` jadvali mavjud emas**  
   Bunda ba’zan 400 yoki 404 qaytadi (loyiha sozlamasiga qarab).

2. **Jadvalda `clinic_id` ustuni yo‘q**  
   So‘rovda `clinic_id=eq.10` ishlatilgani uchun PostgREST faqat shu ustun mavjud jadvallarda ishlashini kutadi. Ustun bo‘lmasa → 400.

3. **Jadvalda `changed_at` ustuni yo‘q**  
   `order=changed_at.desc` bo‘lgani uchun PostgREST `changed_at` ustunini kutadi. Ustun bo‘lmasa → 400.

4. **Jadval boshqa migratsiyasiz / qo‘lda yaratilgan**  
   Eski yoki boshqa loyihadan nusxa bo‘lsa, unda `id`, `created_at` bo‘lishi mumkin, lekin `clinic_id` va `changed_at` bo‘lmasa, hozirgi so‘rov 400 beradi.

## Yechim: Supabase ni to‘g‘rilash

Loyiha ildizida **`SUPABASE_SERVICE_PRICE_AUDIT.sql`** fayli bor. Uni Supabase Dashboard → SQL Editor da **bitta marta** ishlating. Skript:

- `service_price_audit` jadvali yo‘q bo‘lsa — yaratadi (`id`, `clinic_id`, `service_id`, `service_name`, `old_price`, `new_price`, `changed_at` va h.k.).
- Jadval bor lekin `clinic_id` yoki `changed_at` yo‘q bo‘lsa — shu ustunlarni qo‘shadi.

Migratsiyani ishlatgach, bir xil so‘rov (`clinic_id=eq.10&order=changed_at.desc&limit=50`) 400 bermasligi kerak.

## Frontend (ilova) tomonda

`listServicePriceAudit` endi avval **eng xavfsiz** so‘rovni yuboradi (`order=id.desc&limit=50`), keyin `created_at`, oxirida `changed_at`. Shuning uchun jadvalda kamida `id` bo‘lsa, 400 kamroq chiqadi. **Asosiy yechim — Supabase da jadval va ustunlarni `SUPABASE_SERVICE_PRICE_AUDIT.sql` orqali to‘g‘rilash** (clinic_id va changed_at bo‘lsa, to‘liq audit va filtr ishlaydi).
