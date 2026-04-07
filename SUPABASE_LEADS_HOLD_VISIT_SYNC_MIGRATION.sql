-- Lead Hold + Visit Sync Migration
-- Final freeze rules:
-- 1) Funnel: new -> contacted -> booked
-- 2) Temporary hold: 30 minutes via hold_expires_at (new/contacted)
-- 3) booked is permanent reservation (no TTL)
-- 4) Operational truth: visits; acquisition truth: leads

BEGIN;

-- ============================================================================
-- 1) SCHEMA: HOLD + TRACEABILITY FIELDS
-- ============================================================================

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS visit_id INTEGER;

ALTER TABLE public.visits
ADD COLUMN IF NOT EXISTS lead_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leads_visit_id_fkey'
      AND conrelid = 'public.leads'::regclass
  ) THEN
    ALTER TABLE public.leads
    ADD CONSTRAINT leads_visit_id_fkey
    FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'visits_lead_id_fkey'
      AND conrelid = 'public.visits'::regclass
  ) THEN
    ALTER TABLE public.visits
    ADD CONSTRAINT visits_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- 2) INDEXES: FAST LOOKUPS + CONFLICT PREVENTION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_leads_hold_expires_at ON public.leads(hold_expires_at);
CREATE INDEX IF NOT EXISTS idx_leads_slot_lookup ON public.leads(doctor_id, preferred_date, preferred_time);

-- Temporary active holds (new/contacted). Cleanup worker should release expired holds.
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_active_hold_slot_unique
ON public.leads(doctor_id, preferred_date, preferred_time)
WHERE status IN ('new', 'contacted')
  AND preferred_date IS NOT NULL
  AND preferred_time IS NOT NULL;

-- booked = permanent reservation
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_booked_slot_unique
ON public.leads(doctor_id, preferred_date, preferred_time)
WHERE status = 'booked'
  AND preferred_date IS NOT NULL
  AND preferred_time IS NOT NULL;

-- One visit can belong to only one lead (optional one-to-one sync guard)
CREATE UNIQUE INDEX IF NOT EXISTS idx_visits_lead_id_unique
ON public.visits(lead_id)
WHERE lead_id IS NOT NULL;

-- ============================================================================
-- 3) TRIGGER: AUTO TTL MANAGEMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_lead_hold_ttl()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('new', 'contacted') THEN
    IF NEW.hold_expires_at IS NULL THEN
      NEW.hold_expires_at := NOW() + INTERVAL '30 minutes';
    END IF;
  ELSIF NEW.status = 'booked' THEN
    NEW.hold_expires_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_apply_hold_ttl_trigger ON public.leads;
CREATE TRIGGER leads_apply_hold_ttl_trigger
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.apply_lead_hold_ttl();

-- Backfill existing rows (safe and idempotent)
UPDATE public.leads
SET hold_expires_at = COALESCE(hold_expires_at, NOW() + INTERVAL '30 minutes')
WHERE status IN ('new', 'contacted');

UPDATE public.leads
SET hold_expires_at = NULL
WHERE status = 'booked';

-- ============================================================================
-- 4) CLEANUP FUNCTION (for periodic worker/cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_lead_holds()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER := 0;
BEGIN
  UPDATE public.leads
  SET status = 'expired',
      updated_at = NOW()
  WHERE status IN ('new', 'contacted')
    AND hold_expires_at IS NOT NULL
    AND hold_expires_at <= NOW();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Optional scheduler examples:
-- SELECT public.cleanup_expired_lead_holds();
-- If pg_cron is available, run every 1-5 minutes.
