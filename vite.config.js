import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import { parseVisionImagePayload } from './src/lib/visionImportCore.js'

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

          // Telegram bot API proxy (dev): /api/telegram/* -> localhost:3001/api/*
          const telegramPort = Number(env.TELEGRAM_BOT_PORT || env.VITE_TELEGRAM_BOT_PORT || 3001)
          const telegramHost = env.TELEGRAM_BOT_HOST || '127.0.0.1'

          server.middlewares.use('/api/telegram', (req, res) => {
            const targetPath = `/api${req.url || ''}`
            const proxyReq = http.request(
              {
                hostname: telegramHost,
                port: telegramPort,
                path: targetPath,
                method: req.method,
                headers: {
                  ...req.headers,
                  host: `${telegramHost}:${telegramPort}`,
                },
              },
              (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
                proxyRes.pipe(res)
              }
            )

            proxyReq.on('error', (err) => {
              // Bot ixtiyoriy: 502 o'rniga 200 + ok:false (browser Network'da qizil 502 chiqmasin)
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                ok: false,
                error: 'TELEGRAM_BOT_UNREACHABLE',
                message: `Telegram bot ishlamayapti (${telegramHost}:${telegramPort}). telegram-bot papkasida: npm start`,
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
