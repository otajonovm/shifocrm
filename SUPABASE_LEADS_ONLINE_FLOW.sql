-- Onlayn yozilishlar oqimi: bemor tasdiqlanguncha visit/appointment patient_id siz
-- Supabase SQL Editor da ishga tushiring
--
-- Eslatma: telegram_chat_ids.patient_id PRIMARY KEY bo'lib, boshqa jadvallar FK
-- bog'langan — shu jadvalga tegmaymiz. Lead ↔ Telegram uchun lead_telegram_chats ishlatiladi.

-- 1. visits.patient_id nullable (allaqachon o'tgan bo'lsa xato bermasligi uchun)
DO $$ BEGIN
  ALTER TABLE public.visits ALTER COLUMN patient_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. appointments.patient_id nullable
DO $$ BEGIN
  ALTER TABLE public.appointments ALTER COLUMN patient_id DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 3. Lead ↔ Telegram (bemor yaratilmasdan)
CREATE TABLE IF NOT EXISTS public.lead_telegram_chats (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL UNIQUE,
  chat_id TEXT NOT NULL,
  phone TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_telegram_chats_lead_id
  ON public.lead_telegram_chats(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_telegram_chats_phone
  ON public.lead_telegram_chats(phone);

ALTER TABLE public.lead_telegram_chats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "lead_telegram_chats_select" ON public.lead_telegram_chats FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "lead_telegram_chats_insert" ON public.lead_telegram_chats FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "lead_telegram_chats_update" ON public.lead_telegram_chats FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "lead_telegram_chats_delete" ON public.lead_telegram_chats FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Muddati tugagan hold → bog'langan visit bekor
CREATE OR REPLACE FUNCTION public.cleanup_expired_lead_holds()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER := 0;
  expired_lead RECORD;
BEGIN
  FOR expired_lead IN
    SELECT id, visit_id
    FROM public.leads
    WHERE status IN ('hold', 'new', 'contacted')
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at <= NOW()
      AND telegram_linked_at IS NULL
  LOOP
    UPDATE public.leads
    SET status = 'expired',
        updated_at = NOW()
    WHERE id = expired_lead.id;

    IF expired_lead.visit_id IS NOT NULL THEN
      UPDATE public.visits
      SET status = 'cancelled',
          updated_at = NOW()
      WHERE id = expired_lead.visit_id
        AND status NOT IN ('completed_paid', 'completed_debt', 'in_progress');

      UPDATE public.appointments
      SET status = 'canceled',
          updated_at = NOW()
      WHERE visit_id = expired_lead.visit_id
        AND status NOT IN ('completed', 'arrived');
    END IF;

    affected_rows := affected_rows + 1;
  END LOOP;

  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;
