BEGIN;

ALTER TABLE IF EXISTS public.odontograms
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS dentition_type TEXT NOT NULL DEFAULT 'permanent';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'odontograms_dentition_type_check'
  ) THEN
    ALTER TABLE public.odontograms
      ADD CONSTRAINT odontograms_dentition_type_check
      CHECK (dentition_type IN ('permanent', 'primary', 'mixed'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.odontogram_revisions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  odontogram_id INTEGER NOT NULL REFERENCES public.odontograms(id) ON DELETE CASCADE,
  clinic_id BIGINT NOT NULL,
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  actor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_odontogram_revisions_parent
  ON public.odontogram_revisions(odontogram_id, version DESC);

ALTER TABLE public.odontogram_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odontogram_revisions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS odontogram_revisions_select ON public.odontogram_revisions;
CREATE POLICY odontogram_revisions_select ON public.odontogram_revisions
FOR SELECT TO authenticated
USING (
  public.current_app_session_valid()
  AND clinic_id = public.current_clinic_id()
  AND public.current_employee_has('patients', 'view')
);

CREATE TABLE IF NOT EXISTS public.diagnoses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL,
  patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id INTEGER REFERENCES public.visits(id) ON DELETE SET NULL,
  code TEXT,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clinical_procedures (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clinic_id BIGINT NOT NULL,
  patient_id INTEGER NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  visit_id INTEGER REFERENCES public.visits(id) ON DELETE CASCADE,
  service_id BIGINT,
  tooth_id INTEGER,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_visit_services_visit_tooth
  ON public.visit_services(visit_id, tooth_id)
  WHERE tooth_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.normalize_uz_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), '')
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_patients_clinic_phone
  ON public.patients(clinic_id, public.normalize_uz_phone(phone))
  WHERE public.normalize_uz_phone(phone) IS NOT NULL
    AND length(public.normalize_uz_phone(phone)) >= 12;

CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id BIGINT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.import_rows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  parsed JSONB,
  patient_id INTEGER,
  error_message TEXT,
  clinic_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.import_rows
  ADD COLUMN IF NOT EXISTS clinic_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_import_rows_job_line
  ON public.import_rows(job_id, row_index);

CREATE OR REPLACE FUNCTION public.replace_odontogram_versioned(
  p_id INTEGER,
  p_expected_version INTEGER,
  p_data JSONB,
  p_dentition_type TEXT DEFAULT NULL
)
RETURNS public.odontograms
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row public.odontograms;
BEGIN
  IF NOT public.current_app_session_valid() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_data -> 'teeth') <> 'object' THEN
    RAISE EXCEPTION 'invalid_odontogram' USING ERRCODE = '22023';
  END IF;

  UPDATE public.odontograms
  SET data = p_data,
      version = version + 1,
      dentition_type = COALESCE(NULLIF(p_dentition_type, ''), dentition_type),
      updated_at = NOW()
  WHERE id = p_id
    AND clinic_id = public.current_clinic_id()
    AND version = p_expected_version
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'odontogram_version_conflict' USING ERRCODE = '40001';
  END IF;

  INSERT INTO public.odontogram_revisions(odontogram_id, clinic_id, version, data, actor)
  VALUES (
    v_row.id, v_row.clinic_id, v_row.version, v_row.data, public.current_app_role()
  );

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.import_patient_row(
  p_job_id UUID,
  p_row_index INTEGER,
  p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_clinic_id BIGINT := public.current_clinic_id();
  v_phone TEXT := public.normalize_uz_phone(p_payload ->> 'phone');
  v_patient public.patients;
  v_visit public.visits;
  v_visit_entry JSONB;
  v_price NUMERIC;
  v_paid NUMERIC;
  v_status TEXT;
  v_visit_ids BIGINT[] := '{}';
BEGIN
  IF NOT public.current_app_session_valid() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
  IF COALESCE(NULLIF(TRIM(p_payload ->> 'full_name'), ''), '') = '' THEN
    RAISE EXCEPTION 'full_name_required' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.import_jobs(id, clinic_id, status)
  VALUES (p_job_id, v_clinic_id, 'running')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.import_rows(job_id, row_index, status, parsed, clinic_id)
  VALUES (p_job_id, p_row_index, 'processing', p_payload, v_clinic_id)
  ON CONFLICT (job_id, row_index) DO NOTHING;

  IF NOT FOUND THEN
    SELECT patient_id INTO v_patient.id
    FROM public.import_rows
    WHERE job_id = p_job_id AND row_index = p_row_index;
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'patient_id', v_patient.id);
  END IF;

  IF v_phone IS NOT NULL THEN
    SELECT * INTO v_patient
    FROM public.patients
    WHERE clinic_id = v_clinic_id
      AND public.normalize_uz_phone(phone) = v_phone
    FOR UPDATE;
  END IF;

  IF v_patient.id IS NULL THEN
    INSERT INTO public.patients(
      clinic_id, full_name, phone, birth_date, address, notes, status
    ) VALUES (
      v_clinic_id,
      TRIM(p_payload ->> 'full_name'),
      NULLIF(p_payload ->> 'phone', ''),
      NULLIF(p_payload ->> 'birth_date', '')::date,
      NULLIF(p_payload ->> 'address', ''),
      NULLIF(p_payload ->> 'notes', ''),
      'waiting'
    )
    RETURNING * INTO v_patient;
  END IF;

  FOR v_visit_entry IN
    SELECT * FROM jsonb_array_elements(COALESCE(p_payload -> 'visit_history', '[]'::jsonb))
  LOOP
    v_price := NULLIF(v_visit_entry ->> 'price', '')::numeric;
    v_paid := NULLIF(v_visit_entry ->> 'paid_amount', '')::numeric;
    v_status := CASE
      WHEN v_price IS NULL OR v_price <= 0 THEN 'completed_paid'
      WHEN v_paid IS NULL THEN 'completed_debt'
      WHEN v_paid >= v_price THEN 'completed_paid'
      ELSE 'completed_debt'
    END;

    INSERT INTO public.visits(
      id, clinic_id, patient_id, date, status, price, paid_amount,
      service_name, notes, channel, duration_minutes
    ) VALUES (
      (10000 + floor(random() * 90000))::int,
      v_clinic_id,
      v_patient.id,
      COALESCE(NULLIF(v_visit_entry ->> 'visit_date', '')::date, CURRENT_DATE),
      v_status,
      v_price,
      v_paid,
      NULLIF(v_visit_entry ->> 'service_name', ''),
      COALESCE(NULLIF(v_visit_entry ->> 'notes', ''), 'Daftar import'),
      'import',
      60
    )
    RETURNING * INTO v_visit;

    v_visit_ids := array_append(v_visit_ids, v_visit.id);

    IF NULLIF(v_visit_entry ->> 'service_name', '') IS NOT NULL OR v_price IS NOT NULL THEN
      INSERT INTO public.visit_services(
        clinic_id, visit_id, patient_id, service_name, price
      ) VALUES (
        v_clinic_id, v_visit.id, v_patient.id,
        COALESCE(NULLIF(v_visit_entry ->> 'service_name', ''), 'Import'),
        COALESCE(v_price, 0)
      );
    END IF;

    IF v_paid IS NOT NULL AND v_paid > 0 THEN
      INSERT INTO public.payments(
        clinic_id, visit_id, patient_id, amount, payment_type, method, note, paid_at
      ) VALUES (
        v_clinic_id, v_visit.id, v_patient.id, v_paid, 'payment', 'cash',
        'Daftar import', NOW()
      );
    END IF;
  END LOOP;

  UPDATE public.import_rows
  SET status = 'imported',
      patient_id = v_patient.id
  WHERE job_id = p_job_id AND row_index = p_row_index;

  RETURN jsonb_build_object(
    'ok', true,
    'patient_id', v_patient.id,
    'visit_ids', to_jsonb(v_visit_ids)
  );
EXCEPTION WHEN OTHERS THEN
  UPDATE public.import_rows
  SET status = 'failed',
      error_message = SQLERRM
  WHERE job_id = p_job_id AND row_index = p_row_index;
  RAISE;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_odontogram_versioned(INTEGER, INTEGER, JSONB, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.import_patient_row(UUID, INTEGER, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_odontogram_versioned(INTEGER, INTEGER, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_patient_row(UUID, INTEGER, JSONB) TO authenticated;

COMMIT;
