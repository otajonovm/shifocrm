/* eslint-disable no-unused-vars */
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'ShifoCRM',
        short_name: 'ShifoCRM',
        description: 'Klinikalar uchun mini CRM',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    }),
    // Custom plugin to save db.json in development
    {
      name: 'save-db-json',
      configureServer(server) {
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
                } catch (e) {
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
                } catch (e) {
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
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
