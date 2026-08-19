-- Supabase SQL Editor da bir marta ishga tushiring.
-- consume_visit_materials idempotent tekshiruvi yoziladigan source_key
-- (p_source_key || ':' || item_id) bilan mos kelishi kerak.

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
      AND (
        source_key = p_source_key
        OR source_key LIKE p_source_key || ':%'
      )
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

REVOKE ALL ON FUNCTION public.consume_visit_materials(BIGINT, JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_visit_materials(BIGINT, JSONB, TEXT) TO authenticated;
