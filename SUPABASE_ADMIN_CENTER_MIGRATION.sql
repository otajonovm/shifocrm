-- Admin Center: activity_logs kengaytirish, notification_events, staff engagement RPC
-- Supabase SQL Editor da bir marta ishga tushiring.

-- -----------------------------------------------------------------------------
-- 1. activity_logs: clinic_id + indekslar
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.activity_logs
  ADD COLUMN IF NOT EXISTS clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE;

UPDATE public.activity_logs al
SET clinic_id = (al.details->>'clinic_id')::bigint
WHERE al.clinic_id IS NULL
  AND al.details->>'clinic_id' IS NOT NULL
  AND (al.details->>'clinic_id') ~ '^\d+$';

UPDATE public.activity_logs al
SET clinic_id = e.clinic_id
FROM public.employees e
WHERE al.clinic_id IS NULL
  AND al.employee_id IS NOT NULL
  AND al.employee_id = e.id
  AND e.clinic_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_logs_clinic_created
  ON public.activity_logs(clinic_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_employee_action_created
  ON public.activity_logs(employee_id, action, created_at DESC);

-- -----------------------------------------------------------------------------
-- 2. notification_events (ROI / Telegram attribution)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id BIGINT REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id BIGINT,
  channel TEXT NOT NULL DEFAULT 'telegram',
  event_type TEXT NOT NULL,
  source_table TEXT,
  source_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  patient_action TEXT,
  action_at TIMESTAMPTZ,
  attributed_visit_id BIGINT,
  attributed_amount NUMERIC(14, 2),
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_events_clinic_sent
  ON public.notification_events(clinic_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_events_patient_type
  ON public.notification_events(patient_id, event_type);

CREATE INDEX IF NOT EXISTS idx_notification_events_source
  ON public.notification_events(source_table, source_id);

-- -----------------------------------------------------------------------------
-- 3. RLS: activity_logs va notification_events (anon app)
-- -----------------------------------------------------------------------------
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Super admins insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "App manage activity logs" ON public.activity_logs;

CREATE POLICY "App manage activity logs"
  ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "App manage notification events" ON public.notification_events;
CREATE POLICY "App manage notification events"
  ON public.notification_events FOR ALL USING (true) WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4. RPC: staff engagement stats
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_staff_engagement_stats(
  p_clinic_id BIGINT,
  p_since TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '90 days')
)
RETURNS TABLE (
  employee_id UUID,
  last_activity_at TIMESTAMPTZ,
  patient_views_today BIGINT,
  patient_updates_today BIGINT,
  total_actions BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH today_start AS (
    SELECT date_trunc('day', NOW() AT TIME ZONE 'Asia/Tashkent') AS ts
  ),
  logs AS (
    SELECT
      al.employee_id,
      al.action,
      al.created_at,
      al.clinic_id,
      COALESCE(al.clinic_id, (al.details->>'clinic_id')::bigint) AS resolved_clinic_id
    FROM public.activity_logs al
    WHERE al.created_at >= p_since
      AND al.employee_id IS NOT NULL
  ),
  filtered AS (
    SELECT *
    FROM logs
    WHERE p_clinic_id IS NULL OR resolved_clinic_id = p_clinic_id
  )
  SELECT
    f.employee_id,
    MAX(f.created_at) AS last_activity_at,
    COUNT(*) FILTER (
      WHERE f.action = 'patient.view'
        AND f.created_at >= (SELECT ts FROM today_start)
    ) AS patient_views_today,
    COUNT(*) FILTER (
      WHERE f.action = 'patient.update'
        AND f.created_at >= (SELECT ts FROM today_start)
    ) AS patient_updates_today,
    COUNT(*)::bigint AS total_actions
  FROM filtered f
  GROUP BY f.employee_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_staff_engagement_stats(BIGINT, TIMESTAMPTZ) TO anon, authenticated, service_role;
