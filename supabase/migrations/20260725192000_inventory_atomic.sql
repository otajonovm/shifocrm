BEGIN;

ALTER TABLE IF EXISTS public.inventory_logs
  ADD COLUMN IF NOT EXISTS source_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_log_source
  ON public.inventory_logs(clinic_id, source_key)
  WHERE source_key IS NOT NULL;

DROP TRIGGER IF EXISTS trigger_inventory_consumption ON public.inventory_consumptions;

CREATE OR REPLACE FUNCTION public.consume_visit_materials(
  p_visit_id BIGINT,
  p_lines JSONB,
  p_source_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_clinic_id BIGINT;
  v_line RECORD;
  v_before NUMERIC;
  v_logs JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.current_app_session_valid() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT clinic_id INTO STRICT v_clinic_id
  FROM public.visits
  WHERE id = p_visit_id
    AND clinic_id = public.current_clinic_id()
  FOR UPDATE;

  IF EXISTS (
    SELECT 1 FROM public.inventory_logs
    WHERE clinic_id = v_clinic_id
      AND source_key = p_source_key
  ) THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'logs', v_logs);
  END IF;

  FOR v_line IN
    SELECT *
    FROM jsonb_to_recordset(COALESCE(p_lines, '[]'::jsonb))
      AS x(item_id BIGINT, quantity NUMERIC, patient_id BIGINT, doctor_id BIGINT)
  LOOP
    IF v_line.quantity IS NULL OR v_line.quantity <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = '22023';
    END IF;

    SELECT current_stock INTO STRICT v_before
    FROM public.clinic_inventory
    WHERE id = v_line.item_id
      AND clinic_id = v_clinic_id
    FOR UPDATE;

    IF v_before < v_line.quantity THEN
      RAISE EXCEPTION 'insufficient_stock:item=%', v_line.item_id
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  FOR v_line IN
    SELECT *
    FROM jsonb_to_recordset(COALESCE(p_lines, '[]'::jsonb))
      AS x(item_id BIGINT, quantity NUMERIC, patient_id BIGINT, doctor_id BIGINT)
  LOOP
    SELECT current_stock INTO STRICT v_before
    FROM public.clinic_inventory
    WHERE id = v_line.item_id
      AND clinic_id = v_clinic_id
    FOR UPDATE;

    UPDATE public.clinic_inventory
    SET current_stock = v_before - v_line.quantity,
        updated_at = NOW()
    WHERE id = v_line.item_id
      AND clinic_id = v_clinic_id;

    INSERT INTO public.inventory_logs(
      clinic_id, item_id, type, quantity, reason,
      stock_before, stock_after, visit_id, patient_id, doctor_id, source_key
    ) VALUES (
      v_clinic_id, v_line.item_id, 'out', v_line.quantity,
      'Xizmat retsepti (atomic)',
      v_before, v_before - v_line.quantity,
      p_visit_id, v_line.patient_id, v_line.doctor_id,
      p_source_key || ':' || v_line.item_id
    )
    RETURNING jsonb_build_object(
      'item_id', item_id,
      'quantity', quantity,
      'stock_after', stock_after
    ) INTO v_logs;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'idempotent', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.reverse_visit_consumption(
  p_log_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_log public.inventory_logs;
BEGIN
  IF NOT public.current_app_session_valid() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO STRICT v_log
  FROM public.inventory_logs
  WHERE id = p_log_id
    AND clinic_id = public.current_clinic_id()
    AND type = 'out'
  FOR UPDATE;

  UPDATE public.clinic_inventory
  SET current_stock = COALESCE(current_stock, 0) + v_log.quantity,
      updated_at = NOW()
  WHERE id = v_log.item_id
    AND clinic_id = v_log.clinic_id;

  INSERT INTO public.inventory_logs(
    clinic_id, item_id, type, quantity, reason,
    stock_before, stock_after, visit_id, patient_id, doctor_id, source_key
  )
  SELECT
    clinic_id, item_id, 'in', quantity,
    'Reverse consumption #' || p_log_id,
    current_stock - quantity, current_stock,
    visit_id, patient_id, doctor_id,
    'reverse:' || p_log_id
  FROM public.clinic_inventory
  WHERE id = v_log.item_id;

  DELETE FROM public.inventory_logs WHERE id = p_log_id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_legacy_inventory_item(
  p_visit_id INTEGER,
  p_patient_id INTEGER,
  p_doctor_id INTEGER,
  p_item_id BIGINT,
  p_quantity NUMERIC,
  p_note TEXT DEFAULT NULL,
  p_source_key TEXT DEFAULT NULL
)
RETURNS public.inventory_consumptions
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_clinic_id BIGINT;
  v_before NUMERIC;
  v_row public.inventory_consumptions;
BEGIN
  IF NOT public.current_app_session_valid() THEN
    RAISE EXCEPTION 'unauthorized' USING ERRCODE = '42501';
  END IF;
  v_clinic_id := public.current_clinic_id();
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = '22023';
  END IF;

  SELECT current_stock INTO STRICT v_before
  FROM public.inventory_items
  WHERE id = p_item_id
    AND clinic_id = v_clinic_id
  FOR UPDATE;

  IF v_before < p_quantity THEN
    RAISE EXCEPTION 'insufficient_stock:item=%', p_item_id USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.inventory_items
  SET current_stock = v_before - p_quantity,
      updated_at = NOW()
  WHERE id = p_item_id;

  INSERT INTO public.inventory_consumptions(
    visit_id, patient_id, doctor_id, item_id, quantity, note, clinic_id
  ) VALUES (
    p_visit_id, p_patient_id, p_doctor_id, p_item_id, p_quantity, p_note, v_clinic_id
  )
  RETURNING * INTO v_row;

  INSERT INTO public.inventory_movements(
    item_id, type, quantity, note, visit_id, doctor_id, clinic_id, created_by
  ) VALUES (
    p_item_id, 'out', p_quantity, COALESCE(p_note, 'Consumption'),
    p_visit_id, p_doctor_id, v_clinic_id, public.current_app_role()
  );

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_visit_materials(BIGINT, JSONB, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reverse_visit_consumption(BIGINT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_legacy_inventory_item(INTEGER, INTEGER, INTEGER, BIGINT, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_visit_materials(BIGINT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_visit_consumption(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_legacy_inventory_item(INTEGER, INTEGER, INTEGER, BIGINT, NUMERIC, TEXT, TEXT) TO authenticated;

COMMIT;
