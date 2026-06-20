-- Faza 2: Visits ↔ Appointments sinxronizatsiya, slot cheklovlari, Leads hold/reminder
--
-- MUHIM: Transaction ishlatilmaydi — xato bo'lsa ham oldingi qadamlar saqlanadi.
-- Agar appointments yo'q bo'lsa, avval SUPABASE_APPOINTMENTS_BOOTSTRAP.sql ni ishga tushiring.
-- Keyin ushbu faylni to'liq ishga tushiring (xato bo'lsa tuzatib qayta run qiling).

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- 0) appointments jadvali (agar hali yaratilmagan bo'lsa)
-- Avval SUPABASE_APPOINTMENTS_TABLE.sql ishga tushirilmagan bo'lishi mumkin.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id BIGSERIAL PRIMARY KEY,
  clinic_id BIGINT NOT NULL,
  patient_id BIGINT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id BIGINT REFERENCES public.doctors(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'Public can view appointments'
  ) THEN
    CREATE POLICY "Public can view appointments"
      ON public.appointments FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'Public can insert appointments'
  ) THEN
    CREATE POLICY "Public can insert appointments"
      ON public.appointments FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'Public can update appointments'
  ) THEN
    CREATE POLICY "Public can update appointments"
      ON public.appointments FOR UPDATE USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'Public can delete appointments'
  ) THEN
    CREATE POLICY "Public can delete appointments"
      ON public.appointments FOR DELETE USING (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointments_updated_at_trigger ON public.appointments;
CREATE TRIGGER appointments_updated_at_trigger
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_appointments_updated_at();

-- ============================================================================
-- 2.1 — Bog'lanish ustunlari
-- ============================================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS visit_id INTEGER;

ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS appointment_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_visit_id_fkey'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_visit_id_fkey
      FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'visits_appointment_id_fkey'
  ) THEN
    ALTER TABLE public.visits
      ADD CONSTRAINT visits_appointment_id_fkey
      FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_visits_appointment_id_unique
  ON public.visits(appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_visit_id
  ON public.appointments(visit_id)
  WHERE visit_id IS NOT NULL;

-- ============================================================================
-- 2.4 — Leads: patient_id, appointment_time, eslatma flaglari
-- ============================================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS patient_id BIGINT,
  ADD COLUMN IF NOT EXISTS appointment_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_patient_id_fkey'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_patient_id_fkey
      FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_patient_id ON public.leads(patient_id);
CREATE INDEX IF NOT EXISTS idx_leads_appointment_time ON public.leads(appointment_time);
CREATE INDEX IF NOT EXISTS idx_leads_reminder_due
  ON public.leads(appointment_time)
  WHERE reminder_2h_sent = FALSE
    AND status IN ('hold', 'new', 'contacted', 'booked', 'confirmed');

-- appointment_time avtomatik to'ldirish
CREATE OR REPLACE FUNCTION public.set_lead_appointment_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.preferred_date IS NOT NULL AND NEW.preferred_time IS NOT NULL THEN
    NEW.appointment_time := (NEW.preferred_date::TEXT || ' ' || NEW.preferred_time::TEXT)::TIMESTAMPTZ;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_set_appointment_time_trigger ON public.leads;
CREATE TRIGGER leads_set_appointment_time_trigger
  BEFORE INSERT OR UPDATE OF preferred_date, preferred_time ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_appointment_time();

UPDATE public.leads
SET appointment_time = (preferred_date::TEXT || ' ' || preferred_time::TEXT)::TIMESTAMPTZ
WHERE preferred_date IS NOT NULL
  AND preferred_time IS NOT NULL
  AND appointment_time IS NULL;

-- Hold TTL: hold status qo'shildi
CREATE OR REPLACE FUNCTION public.apply_lead_hold_ttl()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('hold', 'new', 'contacted') THEN
    IF NEW.hold_expires_at IS NULL THEN
      NEW.hold_expires_at := NOW() + INTERVAL '30 minutes';
    END IF;
  ELSIF NEW.status IN ('booked', 'confirmed', 'qabulda') THEN
    NEW.hold_expires_at := NULL;
  ELSIF NEW.status IN ('expired', 'canceled', 'cancelled', 'rejected') THEN
    NEW.hold_expires_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hold slot unique index yangilash
DROP INDEX IF EXISTS public.idx_leads_active_hold_slot_unique;
CREATE UNIQUE INDEX idx_leads_active_hold_slot_unique
  ON public.leads(doctor_id, preferred_date, preferred_time)
  WHERE status IN ('hold', 'new', 'contacted')
    AND preferred_date IS NOT NULL
    AND preferred_time IS NOT NULL;

CREATE OR REPLACE FUNCTION public.cleanup_expired_lead_holds()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER := 0;
BEGIN
  UPDATE public.leads
  SET status = 'expired',
      updated_at = NOW()
  WHERE status IN ('hold', 'new', 'contacted')
    AND hold_expires_at IS NOT NULL
    AND hold_expires_at <= NOW()
    AND telegram_linked_at IS NULL;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2.1 — Visit ID generator (trigger uchun)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_visit_id()
RETURNS INTEGER AS $$
DECLARE
  new_id INTEGER;
  attempts INTEGER := 0;
BEGIN
  LOOP
    new_id := floor(10000 + random() * 90000)::INTEGER;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.visits v WHERE v.id = new_id);
    attempts := attempts + 1;
    IF attempts > 120 THEN
      new_id := floor(10000 + (EXTRACT(EPOCH FROM NOW())::BIGINT % 90000))::INTEGER;
      EXIT;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Appointment → Visit (status 'arrived' bo'lganda)
CREATE OR REPLACE FUNCTION public.sync_visit_on_appointment_arrived()
RETURNS TRIGGER AS $$
DECLARE
  new_visit_id INTEGER;
  appt_date DATE;
  appt_start TIME;
  appt_end TIME;
  dur_min INTEGER;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'arrived'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.visit_id IS NULL THEN

    dur_min := COALESCE(NEW.duration_minutes, 30);
    appt_date := (NEW.scheduled_at AT TIME ZONE 'UTC')::DATE;
    appt_start := (NEW.scheduled_at AT TIME ZONE 'UTC')::TIME;
    appt_end := ((NEW.scheduled_at + (dur_min || ' minutes')::INTERVAL) AT TIME ZONE 'UTC')::TIME;
    new_visit_id := public.generate_visit_id();

    INSERT INTO public.visits (
      id, patient_id, doctor_id, date, status, notes,
      start_time, end_time, duration_minutes, clinic_id, appointment_id, channel
    ) VALUES (
      new_visit_id,
      NEW.patient_id,
      NEW.doctor_id,
      appt_date,
      'arrived',
      COALESCE(NEW.notes, 'Qabulga keldi — appointment dan yaratildi'),
      appt_start,
      appt_end,
      dur_min,
      NEW.clinic_id,
      NEW.id,
      'appointment_arrival'
    );

    NEW.visit_id := new_visit_id;
  END IF;

  -- Visit mavjud bo'lsa, status sinxron
  IF NEW.visit_id IS NOT NULL AND NEW.status IN ('canceled', 'no_show', 'completed') THEN
    UPDATE public.visits v
    SET status = CASE
          WHEN NEW.status = 'canceled' THEN 'cancelled'
          WHEN NEW.status = 'no_show' THEN 'no_show'
          WHEN NEW.status = 'completed' THEN 'completed_paid'
          ELSE v.status
        END,
        updated_at = NOW()
    WHERE v.id = NEW.visit_id
      AND v.status NOT IN ('completed_paid', 'completed_debt', 'archived');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointments_sync_visit_on_arrival ON public.appointments;
CREATE TRIGGER appointments_sync_visit_on_arrival
  BEFORE UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_visit_on_appointment_arrived();

-- Visit → Appointment (status 'arrived')
CREATE OR REPLACE FUNCTION public.sync_appointment_on_visit_status()
RETURNS TRIGGER AS $$
DECLARE
  appt_status TEXT;
BEGIN
  IF TG_OP <> 'UPDATE' OR OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  appt_status := CASE NEW.status
    WHEN 'arrived' THEN 'arrived'
    WHEN 'cancelled' THEN 'canceled'
    WHEN 'no_show' THEN 'no_show'
    WHEN 'completed_paid' THEN 'completed'
    WHEN 'completed_debt' THEN 'completed'
    ELSE NULL
  END;

  IF appt_status IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.appointment_id IS NOT NULL THEN
    UPDATE public.appointments a
    SET status = appt_status,
        updated_at = NOW()
    WHERE a.id = NEW.appointment_id
      AND a.status IS DISTINCT FROM appt_status;
  END IF;

  -- Appointment yo'q, lekin visit keldi — appointment yaratish (race-safe: faqat NULL bo'lsa)
  IF NEW.appointment_id IS NULL
     AND NEW.status = 'arrived'
     AND NEW.start_time IS NOT NULL
     AND NEW.clinic_id IS NOT NULL THEN

    INSERT INTO public.appointments (
      clinic_id, patient_id, doctor_id, scheduled_at, duration_minutes,
      status, notes, visit_id
    )
    SELECT
      NEW.clinic_id,
      NEW.patient_id,
      NEW.doctor_id,
      (NEW.date::TEXT || ' ' || NEW.start_time::TEXT)::TIMESTAMPTZ,
      COALESCE(NEW.duration_minutes, 30),
      'arrived',
      NEW.notes,
      NEW.id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.appointments a2
      WHERE a2.visit_id = NEW.id
    );

    UPDATE public.visits v
    SET appointment_id = a.id
    FROM public.appointments a
    WHERE v.id = NEW.id
      AND a.visit_id = NEW.id
      AND v.appointment_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS visits_sync_appointment_status ON public.visits;
CREATE TRIGGER visits_sync_appointment_status
  AFTER UPDATE OF status ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_appointment_on_visit_status();

-- ============================================================================
-- 2.2 — Slot conflict: appointments (vaqt oralig'i kesishmasligi)
-- GENERATED ustun ishlatilmaydi (tstzrange immutable emas) — trigger orqali to'ldiriladi.
-- end_time < start_time bo'lgan eski qatorlar uchun xavfsiz range quruvchi.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.build_slot_range(
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ DEFAULT NULL,
  p_fallback_minutes INT DEFAULT 60
)
RETURNS TSTZRANGE AS $$
DECLARE
  dur INT;
  safe_end TIMESTAMPTZ;
BEGIN
  IF p_start IS NULL THEN
    RETURN NULL;
  END IF;

  dur := GREATEST(COALESCE(p_fallback_minutes, 60), 1);
  safe_end := COALESCE(p_end, p_start + (dur || ' minutes')::INTERVAL);

  IF safe_end <= p_start THEN
    safe_end := p_start + (dur || ' minutes')::INTERVAL;
  END IF;

  RETURN TSTZRANGE(p_start, safe_end, '[)');
END;
$$ LANGUAGE plpgsql;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS slot_range TSTZRANGE;

CREATE OR REPLACE FUNCTION public.set_appointment_slot_range()
RETURNS TRIGGER AS $$
DECLARE
  dur INTEGER;
  end_ts TIMESTAMPTZ;
BEGIN
  IF NEW.scheduled_at IS NULL THEN
    NEW.slot_range := NULL;
    RETURN NEW;
  END IF;

  dur := GREATEST(COALESCE(NEW.duration_minutes, 30), 1);
  end_ts := NEW.scheduled_at + (dur || ' minutes')::INTERVAL;
  NEW.slot_range := public.build_slot_range(NEW.scheduled_at, end_ts, dur);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS appointments_set_slot_range_trigger ON public.appointments;
CREATE TRIGGER appointments_set_slot_range_trigger
  BEFORE INSERT OR UPDATE OF scheduled_at, duration_minutes ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_appointment_slot_range();

-- Mavjud qabullar uchun backfill (EXCLUDE dan OLDIN)
UPDATE public.appointments a
SET slot_range = public.build_slot_range(
  a.scheduled_at,
  a.scheduled_at + (GREATEST(COALESCE(a.duration_minutes, 30), 1) || ' minutes')::INTERVAL,
  GREATEST(COALESCE(a.duration_minutes, 30), 1)
)
WHERE a.scheduled_at IS NOT NULL
  AND a.slot_range IS NULL;

DROP INDEX IF EXISTS idx_appointments_doctor_slot_excl;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_doctor_slot_excl;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_doctor_slot_excl'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_doctor_slot_excl
      EXCLUDE USING gist (doctor_id WITH =, slot_range WITH &&)
      WHERE (
        doctor_id IS NOT NULL
        AND slot_range IS NOT NULL
        AND status NOT IN ('canceled', 'cancelled', 'no_show')
      );
  END IF;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE WARNING 'appointments_doctor_slot_excl qo''shilmadi: mavjud qabul konfliktlari bor. Konfliktlarni tozalab, keyin constraint ni qo''lda qo''shing.';
  WHEN OTHERS THEN
    RAISE WARNING 'appointments_doctor_slot_excl qo''shilmadi: %', SQLERRM;
END $$;

-- Visits uchun ham (kalendar asl manbasi)
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS slot_range TSTZRANGE;

CREATE OR REPLACE FUNCTION public.set_visit_slot_range()
RETURNS TRIGGER AS $$
DECLARE
  start_ts TIMESTAMPTZ;
  end_ts TIMESTAMPTZ;
  dur INTEGER;
BEGIN
  IF NEW.date IS NULL OR NEW.start_time IS NULL THEN
    NEW.slot_range := NULL;
    RETURN NEW;
  END IF;

  dur := GREATEST(COALESCE(NEW.duration_minutes, 60), 1);
  start_ts := (NEW.date::TEXT || ' ' || NEW.start_time::TEXT)::TIMESTAMPTZ;

  IF NEW.end_time IS NOT NULL THEN
    end_ts := (NEW.date::TEXT || ' ' || NEW.end_time::TEXT)::TIMESTAMPTZ;
  ELSE
    end_ts := NULL;
  END IF;

  NEW.slot_range := public.build_slot_range(start_ts, end_ts, dur);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS visits_set_slot_range_trigger ON public.visits;
CREATE TRIGGER visits_set_slot_range_trigger
  BEFORE INSERT OR UPDATE OF date, start_time, end_time, duration_minutes ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_visit_slot_range();

-- Mavjud visitlar uchun backfill (EXCLUDE dan OLDIN)
-- end_time noto'g'ri (start dan kichik) bo'lsa, duration bo'yicha tuzatiladi
UPDATE public.visits v
SET slot_range = public.build_slot_range(
  (v.date::TEXT || ' ' || v.start_time::TEXT)::TIMESTAMPTZ,
  CASE
    WHEN v.end_time IS NOT NULL
      THEN (v.date::TEXT || ' ' || v.end_time::TEXT)::TIMESTAMPTZ
    ELSE NULL
  END,
  GREATEST(COALESCE(v.duration_minutes, 60), 1)
)
WHERE v.date IS NOT NULL
  AND v.start_time IS NOT NULL
  AND v.slot_range IS NULL;

DROP INDEX IF EXISTS idx_visits_doctor_slot_excl;

ALTER TABLE public.visits
  DROP CONSTRAINT IF EXISTS visits_doctor_slot_excl;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'visits_doctor_slot_excl'
  ) THEN
    ALTER TABLE public.visits
      ADD CONSTRAINT visits_doctor_slot_excl
      EXCLUDE USING gist (doctor_id WITH =, slot_range WITH &&)
      WHERE (
        doctor_id IS NOT NULL
        AND slot_range IS NOT NULL
        AND status NOT IN ('cancelled', 'canceled', 'no_show', 'archived')
      );
  END IF;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE WARNING 'visits_doctor_slot_excl qo''shilmadi: mavjud tashrif konfliktlari bor. Konfliktlarni tozalab, keyin constraint ni qo''lda qo''shing.';
  WHEN OTHERS THEN
    RAISE WARNING 'visits_doctor_slot_excl qo''shilmadi: %', SQLERRM;
END $$;

-- ============================================================================
-- Realtime (2.3)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'visits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.visits;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;

-- Cron (pg_cron yoki Edge Function):
-- SELECT public.cleanup_expired_lead_holds();
