# ShifoCRM Hardening — Deployment & Rollback Checklist

Do **not** auto-apply migrations to production from CI. Apply from a controlled staging → production window.

## Prerequisites

1. Deploy Edge Function `legacy-auth` with secrets:
   - `APP_JWT_SECRET` — **must equal** Supabase project JWT secret (PostgREST validates bearer tokens)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
2. Rotate any leaked credentials:
   - Remove `VITE_*` admin passwords / bot / Vision secrets from client env
   - Set Vision OCR secrets only on Edge Function / server
   - Rotate Telegram bot token if it ever lived in frontend bundle
3. Confirm `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` only (no service role in browser)

## Migration order (canonical)

Apply in timestamp order under `supabase/migrations/`:

1. `20260725190000_security_foundation.sql`
2. `20260725191000_finance_ledger.sql`
3. `20260725192000_inventory_atomic.sql`
4. `20260725193000_ehr_import.sql`
5. `20260725194000_calendar_integrity.sql`
6. `20260725195000_rbac_capabilities.sql`
7. `20260725196000_telegram_platform.sql`

## Data backfill notes

- Password plaintext → `password_hash` happens on first successful Edge login.
- Visit `slot_range` is backfilled by calendar migration; resolve any remaining double-booked rows **before** adding EXCLUDE if apply fails.
- Payment `adjustment` rows migrate to `expenses` in finance migration.
- Odontogram `version` defaults to `1`; first CAS write increments.

## Post-deploy verification

```bash
node scripts/verify-supabase-security.mjs
npm run test:run
npm run build
```

Assert:

- Anon REST without session returns 401/403 or 0 rows on PHI tables
- `visits_doctor_slot_excl` exists (`pg_constraint`)
- Open cash shift unique constraint exists
- `consume_visit_materials` / `post_visit_payment` / `move_visit` execute as authenticated

## Rollback (high level)

Keep pre-migration DB snapshot. Per-phase SQL rollback sketches:

| Phase | Rollback sketch |
|-------|-----------------|
| Security | Restore prior policies from snapshot; drop `app_sessions` only if no live JWTs |
| Finance | Re-enable old payment triggers from `SUPABASE_INCOME_MIGRATION.sql` backup; drop new RPCs |
| Inventory | Re-create legacy consumption trigger only if required; drop atomic RPCs |
| Calendar | `ALTER TABLE visits DROP CONSTRAINT visits_doctor_slot_excl` |
| Telegram | Drop `claim_scheduled_telegram_messages` |

Prefer restore-from-snapshot over partial reverse DDL in production.

## Credential rotation checklist

- [ ] Supabase anon + service role rotated if previously exposed
- [ ] `APP_JWT_SECRET` aligned with JWT secret after any JWT rotation (redeploy Edge)
- [ ] Telegram bot token rotated; remove browser copies
- [ ] Vision / OCR API keys only in Edge secrets
- [ ] Invalidate all `app_sessions` after emergency rotation (`UPDATE app_sessions SET revoked_at = NOW()`)
