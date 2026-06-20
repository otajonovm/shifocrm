# Supabase Edge Functions

## leads-cron

Har 5 daqiqada ishlaydi:

1. `cleanup_expired_lead_holds()` — 30 daqiqadan o'tgan `hold`/`new`/`contacted` leadlarni `expired` qiladi
2. Qabul vaqtiga 2 soat qolgan bemorlarga Telegram inline eslatma yuboradi

### Deploy

```bash
supabase functions deploy leads-cron --no-verify-jwt
```

### Cron (Dashboard yoki SQL)

```sql
select cron.schedule(
  'leads-cron-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/leads-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### Environment variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`

### Oldin ishga tushiring

`SUPABASE_PHASE2_SYNC_MIGRATION.sql`
