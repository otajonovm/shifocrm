-- Daftar import (Paper → Digital): import_jobs + import_rows
-- Supabase SQL Editor da bir marta ishga tushiring.

CREATE TABLE IF NOT EXISTS public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id BIGINT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'csv',
  status TEXT NOT NULL DEFAULT 'pending',
  total_rows INT NOT NULL DEFAULT 0,
  approved_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  actor_name TEXT,
  actor_role TEXT,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  row_index INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  confidence NUMERIC(5, 2),
  parsed JSONB NOT NULL DEFAULT '{}',
  error_message TEXT,
  patient_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_clinic ON public.import_jobs(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_rows_job ON public.import_rows(job_id, row_index);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "App manage import jobs" ON public.import_jobs;
CREATE POLICY "App manage import jobs"
  ON public.import_jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "App manage import rows" ON public.import_rows;
CREATE POLICY "App manage import rows"
  ON public.import_rows FOR ALL USING (true) WITH CHECK (true);
