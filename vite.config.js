import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import { parseVisionImagePayload } from './src/lib/visionImportCore.js'
import { sendTreatmentPlanReminderSms } from './services/treatmentPlanSms.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      !isProduction && vueDevTools(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'ShifoCRM',
          short_name: 'ShifoCRM',
          description: 'Klinikalar uchun mini CRM tizimi',
          theme_color: '#0ea5e9',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: false,
          type: 'module'
        }
      }),
      // Custom plugin to save db.json in development
      !isProduction && {
        name: 'save-db-json',
        configureServer(server) {
          const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY
          const openaiKey = env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY
          const visionApiKey = geminiKey
            || openaiKey
            || env.VISION_API_KEY
            || env.DEEPSEEK_API_KEY
            || env.VITE_DEEPSEEK_API_KEY
          const visionApiBase = env.VISION_API_BASE
            || (geminiKey ? 'https://generativelanguage.googleapis.com' : '')
            || (openaiKey ? 'https://api.openai.com' : '')
            || 'https://api.deepseek.com'
          const visionModel = env.VISION_MODEL
            || env.VITE_VISION_MODEL
            || (geminiKey ? 'gemini-flash-latest' : '')
            || (openaiKey ? 'gpt-4o' : '')
            || 'deepseek-chat'

          server.middlewares.use('/api/vision-import', (req, res, next) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'content-type',
              })
              res.end()
              return
            }

            if (req.method !== 'POST') {
              next()
              return
            }

            if (!visionApiKey) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                ok: false,
                error: 'VITE_GEMINI_API_KEY .env da sozlanmagan. Dev serverni qayta ishga tushiring.',
              }))
              return
            }

            let body = ''
            req.on('data', (chunk) => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                const payload = JSON.parse(body)
                const result = await parseVisionImagePayload({
                  image_base64: payload.image_base64,
                  mime_type: payload.mime_type,
                  apiKey: visionApiKey,
                  apiBase: visionApiBase,
                  model: visionModel,
                })
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(result))
              } catch (error) {
                console.error('[vision-import]', error?.message || error)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ ok: false, error: error?.message || 'Vision import xatolik' }))
              }
            })
          })

          const fileEnv = {}
          try {
            const envText = readFileSync(fileURLToPath(new URL('./.env', import.meta.url)), 'utf8')
            for (const rawLine of envText.split(/\r?\n/)) {
              const line = rawLine.trim()
              if (!line || line.startsWith('#')) continue
              const eq = line.indexOf('=')
              if (eq <= 0) continue
              let value = line.slice(eq + 1).trim()
              if (
                (value.startsWith('"') && value.endsWith('"'))
                || (value.startsWith("'") && value.endsWith("'"))
              ) {
                value = value.slice(1, -1)
              }
              fileEnv[line.slice(0, eq).trim()] = value
            }
          } catch {
            /* .env yo'q bo'lsa loadEnv yetarli */
          }

          const textUpKeys = [
            'TEXTUP_EMAIL',
            'TEXTUP_PASSWORD',
            'TEXTUP_USER_ID',
            'TEXTUP_SEND_NAME',
            'TEXTUP_TEMPLATE_ID',
            'TEXTUP_TEST_MESSAGE',
            'TEXTUP_API_KEY',
            'TEXTUP_API_SECRET',
          ]
          for (const key of textUpKeys) {
            const value = fileEnv[key] || env[key]
            if (value) process.env[key] = value
          }

          // Dev: davolash rejasi SMS ni TextUp orqali yuborish (bot deploy qilinmasa ham)
          server.middlewares.use('/api/telegram/treatment-plans/send-reminder', (req, res, next) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'content-type, x-api-key',
              })
              res.end()
              return
            }

            if (req.method !== 'POST') {
              next()
              return
            }

            let body = ''
            req.on('data', (chunk) => {
              body += chunk.toString()
            })
            req.on('end', async () => {
              try {
                if (!process.env.TEXTUP_EMAIL || !process.env.TEXTUP_PASSWORD) {
                  res.writeHead(503, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({
                    ok: false,
                    error: 'SMS_NOT_CONFIGURED',
                    message: 'TEXTUP_EMAIL va TEXTUP_PASSWORD .env da ko\'rsatilishi kerak.',
                  }))
                  return
                }

                const payload = JSON.parse(body || '{}')
                const phone = payload.phone
                if (!phone) {
                  res.writeHead(400, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({
                    ok: false,
                    error: 'PHONE_REQUIRED',
                    message: 'Bemor telefon raqami yo\'q. SMS yuborib bo\'lmaydi.',
                  }))
                  return
                }

                console.log('[treatment-plan-sms] so\'rov qabul qilindi')
                const result = await sendTreatmentPlanReminderSms({
                  phone,
                })

                if (!result.success) {
                  console.error('[treatment-plan-sms]', result.error, result.data || '')
                  const templatePending = /shablon|template/i.test(result.error || '')
                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({
                    ok: false,
                    error: templatePending ? 'SMS_TEMPLATE_PENDING' : 'SMS_SEND_FAILED',
                    message: result.error,
                    data: result.data || null,
                  }))
                  return
                }

                console.log('[treatment-plan-sms] SMS yuborildi')
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                  ok: true,
                  channel: 'sms',
                  phone,
                  plan_id: payload.plan_id || null,
                  message: result.data?.message || 'SMS yuborildi',
                }))
              } catch (error) {
                console.error('[treatment-plan-sms]', error?.message || error)
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                  ok: false,
                  error: 'INTERNAL_ERROR',
                  message: error?.message || 'SMS yuborishda xatolik',
                }))
              }
            })
          })

          // Telegram bot API proxy (dev): /api/telegram/* -> remote bot yoki localhost:3001/api/*
          const resolveTelegramProxyTarget = () => {
            const raw = String(env.VITE_TELEGRAM_API_URL || env.TELEGRAM_BOT_API_URL || '').trim()
            if (/^https?:\/\//i.test(raw) && !raw.includes('localhost')) {
              try {
                const remote = new URL(raw)
                const isHttps = remote.protocol === 'https:'
                return {
                  client: isHttps ? https : http,
                  hostname: remote.hostname,
                  port: remote.port ? Number(remote.port) : (isHttps ? 443 : 80),
                  label: `${remote.protocol}//${remote.host}`,
                }
              } catch {
                // fall through to local bot
              }
            }
            const port = Number(env.TELEGRAM_BOT_PORT || env.VITE_TELEGRAM_BOT_PORT || 3001)
            const hostname = env.TELEGRAM_BOT_HOST || '127.0.0.1'
            return {
              client: http,
              hostname,
              port,
              label: `${hostname}:${port}`,
            }
          }

          const readDotEnvValue = (name) => {
            try {
              const envPath = `${process.cwd().replace(/\\/g, '/')}/.env`
              const line = readFileSync(envPath, 'utf8')
                .split(/\r?\n/)
                .find((row) => {
                  const trimmed = row.trim()
                  return trimmed.startsWith(`${name}=`) && !trimmed.startsWith('#')
                })
              if (!line) return ''
              return line.trim().slice(name.length + 1).trim().replace(/^['"]|['"]$/g, '')
            } catch {
              return ''
            }
          }
          const telegramApiKey = String(
            readDotEnvValue('VITE_TELEGRAM_API_KEY')
            || env.VITE_TELEGRAM_API_KEY
            || env.TELEGRAM_BOT_API_KEY
            || env.BOT_API_KEY
            || env.API_KEY
            || ''
          ).trim()
          const telegramTarget = resolveTelegramProxyTarget()
          console.log(
            `[telegram-proxy] ${telegramTarget.label} | X-API-KEY: ${telegramApiKey ? `set (${telegramApiKey.length} chars)` : 'MISSING'}`
          )

          server.middlewares.use('/api/telegram', (req, res) => {
            const target = telegramTarget
            const targetPath = `/api${req.url || ''}`
            const headers = {
              accept: req.headers.accept || 'application/json',
              'content-type': req.headers['content-type'] || 'application/json',
              host: target.port === 443 || target.port === 80
                ? target.hostname
                : `${target.hostname}:${target.port}`,
            }
            if (telegramApiKey) headers['x-api-key'] = telegramApiKey
            if (req.headers['content-length']) {
              headers['content-length'] = req.headers['content-length']
            }

            const proxyReq = target.client.request(
              {
                hostname: target.hostname,
                port: target.port,
                path: targetPath,
                method: req.method,
                headers,
                servername: target.hostname,
              },
              (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
                proxyRes.pipe(res)
              }
            )

            proxyReq.on('error', (err) => {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                ok: false,
                error: 'TELEGRAM_BOT_UNREACHABLE',
                message: `Telegram bot ishlamayapti (${target.label}). .env da VITE_TELEGRAM_API_URL ni tekshiring.`,
                detail: err.message,
              }))
            })

            req.pipe(proxyReq)
          })

          server.middlewares.use('/api/save-db', (req, res, next) => {
            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => {
                body += chunk.toString()
              })
              req.on('end', () => {
                try {
                  const data = JSON.parse(body)
                  const dbPath = fileURLToPath(new URL('./db.json', import.meta.url))

                  let existingDb = { admin: { login: 'admin', password: 'admin123' }, doctors: [] }
                  try {
                    const existingContent = readFileSync(dbPath, 'utf-8')
                    existingDb = JSON.parse(existingContent)
                    if (!existingDb.admin) {
                      existingDb.admin = { login: 'admin', password: 'admin123' }
                    }
                  } catch {
                    console.log('Creating new db.json')
                  }

                  existingDb.doctors = data.doctors || []

                  writeFileSync(dbPath, JSON.stringify(existingDb, null, 2), 'utf-8')

                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ success: true, message: 'db.json updated successfully' }))
                } catch (error) {
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ success: false, error: error.message }))
                }
              })
            } else {
              next()
            }
          })

          server.middlewares.use('/api/save-patients', (req, res, next) => {
            if (req.method === 'POST') {
              let body = ''
              req.on('data', chunk => {
                body += chunk.toString()
              })
              req.on('end', () => {
                try {
                  const data = JSON.parse(body)
                  const dbPath = fileURLToPath(new URL('./db.json', import.meta.url))

                  // Read existing db.json
                  let existingDb = { admin: { login: 'admin', password: 'admin123' }, doctors: [], patients: [] }
                  try {
                    const existingContent = readFileSync(dbPath, 'utf-8')
                    existingDb = JSON.parse(existingContent)
                  } catch {
                    console.log('Creating new db.json')
                  }

                  // Update patients array (preserve other data)
                  existingDb.patients = data.patients || []

                  // Write to db.json
                  writeFileSync(dbPath, JSON.stringify(existingDb, null, 2), 'utf-8')

                  res.writeHead(200, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ success: true, message: 'Patients saved successfully' }))
                } catch (error) {
                  res.writeHead(500, { 'Content-Type': 'application/json' })
                  res.end(JSON.stringify({ success: false, error: error.message }))
                }
              })
            } else {
              next()
            }
          })
        }
      }
    ].filter(Boolean),
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
            supabase: ['@supabase/supabase-js'],
            calendar: ['@fullcalendar/core', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction', '@fullcalendar/resource-timegrid', '@fullcalendar/luxon3', '@fullcalendar/vue3'],
            charts: ['apexcharts', 'vue3-apexcharts'],
            ui: ['@heroicons/vue', '@headlessui/vue', 'vue-toastification']
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
