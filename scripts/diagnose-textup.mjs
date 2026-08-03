/**
 * TextUp diagnostika: login, nick-names, templates
 * node scripts/diagnose-textup.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getTextUpAuth, getTextUpNickNames, getTextUpTemplates } from '../services/smsService.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootEnv = resolve(__dirname, '../.env')

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile(rootEnv)

const auth = await getTextUpAuth()
if (!auth.success) {
  console.error('Login xatosi:', auth.error)
  process.exit(1)
}

console.log('userId:', auth.userId)
console.log('')

const nick = await getTextUpNickNames({ page: 1, limit: 20 })
console.log('=== Nick-names ===')
console.log(JSON.stringify(nick, null, 2))
console.log('')

const tpl = await getTextUpTemplates({ page: 1, limit: 20 })
console.log('=== Templates ===')
console.log(JSON.stringify(tpl, null, 2))
