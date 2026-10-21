# dedicated-bot

Shifokor keshbek Telegram botlari uchun 24/7 webhook.

Telegram: `POST /api/webhook/dedicated/:doctorId`  
CRM: `POST /api/dedicated-bots/provision|notify|deactivate|sync-webhooks`  
Health: `GET /health`

```bash
npx supabase functions deploy dedicated-bot --no-verify-jwt
npx supabase secrets set TELEGRAM_API_KEY=your-long-secret
```
