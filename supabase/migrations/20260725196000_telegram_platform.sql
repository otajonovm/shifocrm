BEGIN;

ALTER TABLE IF EXISTS public.telegram_links
  ADD COLUMN IF NOT EXISTS link_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_telegram_links_clinic_patient
  ON public.telegram_links(clinic_id, patient_id)
  WHERE patient_id IS NOT NULL;

-- Prefer scheduled_messages (legacy bot table); fall back gracefully if absent.
CREATE OR REPLACE FUNCTION public.claim_scheduled_telegram_messages(p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.scheduled_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH cte AS (
    SELECT id
    FROM public.scheduled_messages
    WHERE status = 'pending'
      AND scheduled_time <= NOW()
      AND sent_at IS NULL
    ORDER BY scheduled_time
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(COALESCE(p_limit, 20), 1)
  )
  UPDATE public.scheduled_messages m
  SET status = 'processing',
      updated_at = NOW()
  FROM cte
  WHERE m.id = cte.id
  RETURNING m.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_scheduled_telegram_messages(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_scheduled_telegram_messages(INTEGER) TO service_role;

COMMIT;
