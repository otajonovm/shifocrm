BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS slot_range TSTZRANGE;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS slot_range TSTZRANGE;

CREATE OR REPLACE FUNCTION public.set_visit_slot_range_tashkent()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  dur INTEGER;
BEGIN
  IF NEW.date IS NULL OR NEW.start_time IS NULL THEN
    NEW.starts_at := NULL;
    NEW.ends_at := NULL;
    NEW.slot_range := NULL;
    RETURN NEW;
  END IF;

  dur := GREATEST(COALESCE(NEW.duration_minutes, 60), 1);
  NEW.starts_at := make_timestamptz(
    EXTRACT(YEAR FROM NEW.date)::INT,
    EXTRACT(MONTH FROM NEW.date)::INT,
    EXTRACT(DAY FROM NEW.date)::INT,
    EXTRACT(HOUR FROM NEW.start_time)::INT,
    EXTRACT(MINUTE FROM NEW.start_time)::INT,
    0,
    'Asia/Tashkent'
  );
  NEW.ends_at := NEW.starts_at + make_interval(mins => dur);
  NEW.slot_range := tstzrange(NEW.starts_at, NEW.ends_at, '[)');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS visits_set_slot_range_trigger ON public.visits;
CREATE TRIGGER visits_set_slot_range_trigger
  BEFORE INSERT OR UPDATE OF date, start_time, duration_minutes, end_time
  ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.set_visit_slot_range_tashkent();

UPDATE public.visits
SET starts_at = make_timestamptz(
      EXTRACT(YEAR FROM date)::INT,
      EXTRACT(MONTH FROM date)::INT,
      EXTRACT(DAY FROM date)::INT,
      EXTRACT(HOUR FROM start_time)::INT,
      EXTRACT(MINUTE FROM start_time)::INT,
      0,
      'Asia/Tashkent'
    ),
    ends_at = make_timestamptz(
      EXTRACT(YEAR FROM date)::INT,
      EXTRACT(MONTH FROM date)::INT,
      EXTRACT(DAY FROM date)::INT,
      EXTRACT(HOUR FROM start_time)::INT,
      EXTRACT(MINUTE FROM start_time)::INT,
      0,
      'Asia/Tashkent'
    ) + make_interval(mins => GREATEST(COALESCE(duration_minutes, 60), 1)),
    slot_range = tstzrange(
      make_timestamptz(
        EXTRACT(YEAR FROM date)::INT,
        EXTRACT(MONTH FROM date)::INT,
        EXTRACT(DAY FROM date)::INT,
        EXTRACT(HOUR FROM start_time)::INT,
        EXTRACT(MINUTE FROM start_time)::INT,
        0,
        'Asia/Tashkent'
      ),
      make_timestamptz(
        EXTRACT(YEAR FROM date)::INT,
        EXTRACT(MONTH FROM date)::INT,
        EXTRACT(DAY FROM date)::INT,
        EXTRACT(HOUR FROM start_time)::INT,
        EXTRACT(MINUTE FROM start_time)::INT,
        0,
        'Asia/Tashkent'
      ) + make_interval(mins => GREATEST(COALESCE(duration_minutes, 60), 1)),
      '[)'
    )
WHERE date IS NOT NULL
  AND start_time IS NOT NULL
  AND slot_range IS NULL;

ALTER TABLE public.visits DROP CONSTRAINT IF EXISTS visits_doctor_slot_excl;
ALTER TABLE public.visits
  ADD CONSTRAINT visits_doctor_slot_excl
  EXCLUDE USING gist (
    clinic_id WITH =,
    doctor_id WITH =,
    slot_range WITH &&
  )
  WHERE (
    doctor_id IS NOT NULL
    AND slot_range IS NOT NULL
    AND status NOT IN ('cancelled', 'canceled', 'no_show', 'archived')
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_visit_id
  ON public.appointments(visit_id)
  WHERE visit_id IS NOT NULL;

DROP INDEX IF EXISTS public.idx_leads_active_hold_slot_unique;
CREATE UNIQUE INDEX idx_leads_active_hold_slot_unique
  ON public.leads(clinic_id, doctor_id, preferred_date, preferred_time)
  WHERE status IN ('new', 'contacted', 'hold')
    AND doctor_id IS NOT NULL
    AND preferred_date IS NOT NULL
    AND preferred_time IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_visit_with_appointment(p_visit JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_visit public.visits;
  v_appt public.appointments;
  v_id INTEGER;
BEGIN
  IF NOT public.current_app_session_valid() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  v_id := COALESCE((p_visit ->> 'id')::INT, (10000 + floor(random() * 90000))::INT);

  INSERT INTO public.visits(
    id, clinic_id, patient_id, doctor_id, doctor_name, date, status,
    notes, price, service_name, start_time, end_time, duration_minutes,
    room, channel, updated_by
  ) VALUES (
    v_id,
    public.current_clinic_id(),
    NULLIF(p_visit ->> 'patient_id', '')::INT,
    NULLIF(p_visit ->> 'doctor_id', '')::INT,
    NULLIF(p_visit ->> 'doctor_name', ''),
    COALESCE(NULLIF(p_visit ->> 'date', '')::DATE, CURRENT_DATE),
    COALESCE(NULLIF(p_visit ->> 'status', ''), 'pending'),
    NULLIF(p_visit ->> 'notes', ''),
    NULLIF(p_visit ->> 'price', '')::NUMERIC,
    NULLIF(p_visit ->> 'service_name', ''),
    NULLIF(p_visit ->> 'start_time', '')::TIME,
    NULLIF(p_visit ->> 'end_time', '')::TIME,
    COALESCE(NULLIF(p_visit ->> 'duration_minutes', '')::INT, 60),
    NULLIF(p_visit ->> 'room', ''),
    NULLIF(p_visit ->> 'channel', ''),
    NULLIF(p_visit ->> 'updated_by', '')
  )
  RETURNING * INTO v_visit;

  IF v_visit.start_time IS NOT NULL THEN
    INSERT INTO public.appointments(
      clinic_id, patient_id, doctor_id, scheduled_at, duration_minutes,
      status, notes, visit_id
    ) VALUES (
      v_visit.clinic_id,
      v_visit.patient_id,
      v_visit.doctor_id,
      (v_visit.date::TEXT || ' ' || v_visit.start_time::TEXT)::TIMESTAMPTZ,
      COALESCE(v_visit.duration_minutes, 60),
      'scheduled',
      v_visit.notes,
      v_visit.id
    )
    ON CONFLICT (visit_id) WHERE visit_id IS NOT NULL
    DO UPDATE SET visit_id = EXCLUDED.visit_id
    RETURNING * INTO v_appt;

    UPDATE public.visits
    SET appointment_id = v_appt.id
    WHERE id = v_visit.id
    RETURNING * INTO v_visit;
  END IF;

  RETURN jsonb_build_object('visit', to_jsonb(v_visit), 'appointment', to_jsonb(v_appt));
END;
$$;

CREATE OR REPLACE FUNCTION public.move_visit(
  p_visit_id INTEGER,
  p_doctor_id INTEGER,
  p_date DATE,
  p_start_time TIME,
  p_duration_minutes INTEGER
)
RETURNS public.visits
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_visit public.visits;
  v_end TIME;
BEGIN
  IF NOT public.current_app_session_valid() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  v_end := (p_start_time + make_interval(mins => GREATEST(COALESCE(p_duration_minutes, 60), 1)))::TIME;

  UPDATE public.visits
  SET doctor_id = p_doctor_id,
      date = p_date,
      start_time = p_start_time,
      end_time = v_end,
      duration_minutes = GREATEST(COALESCE(p_duration_minutes, 60), 1)
  WHERE id = p_visit_id
    AND clinic_id = public.current_clinic_id()
  RETURNING * INTO v_visit;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'visit_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_visit.appointment_id IS NOT NULL THEN
    UPDATE public.appointments
    SET doctor_id = p_doctor_id,
        scheduled_at = (p_date::TEXT || ' ' || p_start_time::TEXT)::TIMESTAMPTZ,
        duration_minutes = v_visit.duration_minutes
    WHERE id = v_visit.appointment_id
      AND clinic_id = public.current_clinic_id();
  END IF;

  RETURN v_visit;
END;
$$;

REVOKE ALL ON FUNCTION public.create_visit_with_appointment(JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.move_visit(INTEGER, INTEGER, DATE, TIME, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_visit_with_appointment(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.move_visit(INTEGER, INTEGER, DATE, TIME, INTEGER) TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.appointments') IS NOT NULL THEN
    DROP POLICY IF EXISTS appointments_select_scope ON public.appointments;
    CREATE POLICY appointments_select_scope ON public.appointments
    FOR SELECT TO authenticated
    USING (
      public.current_app_session_valid()
      AND clinic_id = public.current_clinic_id()
      AND (
        public.current_employee_has('appointments', 'view')
        OR doctor_id = public.current_doctor_id()
      )
    );
  END IF;
  IF to_regclass('public.cash_shifts') IS NOT NULL THEN
    DROP POLICY IF EXISTS cash_shifts_scope ON public.cash_shifts;
    CREATE POLICY cash_shifts_scope ON public.cash_shifts
    FOR ALL TO authenticated
    USING (
      public.current_app_session_valid()
      AND clinic_id = public.current_clinic_id()
      AND (
        public.current_employee_has('finance', 'close_shift')
        OR public.current_employee_has('finance', 'open_shift')
        OR public.current_employee_has('payments', 'view')
      )
    )
    WITH CHECK (clinic_id = public.current_clinic_id());
  END IF;
END $$;

COMMIT;
