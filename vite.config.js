import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
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
                
                // Read existing db.json to preserve admin credentials
                let existingDb = { admin: { login: 'admin', password: 'admin123' }, doctors: [] }
                try {
                  const existingContent = readFileSync(dbPath, 'utf-8')
                  existingDb = JSON.parse(existingContent)
                  // Ensure admin object exists
                  if (!existingDb.admin) {
                    existingDb.admin = { login: 'admin', password: 'admin123' }
                  }
                } catch (e) {
                  console.log('Creating new db.json')
                }
                
                // Update doctors array (preserve admin credentials)
                existingDb.doctors = data.doctors || []
                
                // Write to db.json
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
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
