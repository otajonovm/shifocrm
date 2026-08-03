-- payments_type_check ni discount uchun ochish (live data tozalash)
-- Supabase SQL Editor da AVVAL shu faylni run qiling, keyin finance_ledger migratsiyasini.

BEGIN;

-- 1) Eski CHECK larni ochish (nomi farq qilishi mumkin)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_type_check;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_amount_check;

-- 2) Manfiy adjustment -> expenses
INSERT INTO public.expenses (clinic_id, category, amount, paid_at, note)
SELECT
  p.clinic_id,
  COALESCE((regexp_match(COALESCE(p.note, ''), '\[CATEGORY:([^\]]+)\]'))[1], 'other'),
  ABS(p.amount),
  p.paid_at,
  p.note
FROM public.payments p
WHERE p.payment_type = 'adjustment'
  AND p.amount < 0
  AND NOT EXISTS (
    SELECT 1 FROM public.expenses e
    WHERE e.clinic_id = p.clinic_id
      AND e.note IS NOT DISTINCT FROM p.note
      AND e.paid_at IS NOT DISTINCT FROM p.paid_at
      AND e.amount = ABS(p.amount)
  );

-- 3) [DISCOUNT] yozuvlar -> discount
UPDATE public.payments
SET payment_type = 'discount'
WHERE COALESCE(note, '') ILIKE '%[DISCOUNT]%'
  AND payment_type IN ('refund', 'adjustment');

-- 4) Qolgan adjustment: musbat -> payment, manfiy allaqachon expenses ga ko‘chgan
UPDATE public.payments
SET payment_type = 'payment'
WHERE payment_type = 'adjustment'
  AND amount >= 0;

DELETE FROM public.payments
WHERE payment_type = 'adjustment';

-- 5) Noma'lum typelar
UPDATE public.payments
SET payment_type = 'payment'
WHERE payment_type IS NULL
   OR BTRIM(payment_type) = ''
   OR payment_type NOT IN ('payment', 'refund', 'discount');

UPDATE public.payments
SET amount = ABS(amount)
WHERE amount < 0;

-- 6) Yangi CHECK
ALTER TABLE public.payments
  ADD CONSTRAINT payments_type_check
  CHECK (payment_type IN ('payment', 'refund', 'discount'));

ALTER TABLE public.payments
  ADD CONSTRAINT payments_amount_check
  CHECK (amount > 0);

COMMIT;

-- Tekshiruv:
-- SELECT payment_type, COUNT(*) FROM public.payments GROUP BY 1 ORDER BY 2 DESC;
