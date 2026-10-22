const fs = require('fs')
const path = require('path')
const { loadEnv, supabaseKeyRole } = require('./env')

loadEnv()

const { TelegramClient } = require('telegram')
const { StringSession } = require('telegram/sessions')
const { NewMessage } = require('telegram/events')
const { handlePatientMessage, handleAdminToday } = require('./dialog')

const SESSION_FILE = path.resolve(__dirname, '../../.session')
const ADMIN_FILE = path.resolve(__dirname, '../../data/admin.json')

let client = null
let myUserId = ''
const seenMessages = new Set()

function idToString(value) {
  if (value == null) return ''
  if (typeof value === 'object' && typeof value.toString === 'function') return value.toString()
  return String(value)
}

function readSession() {
  if (!fs.existsSync(SESSION_FILE)) return ''
  return fs.readFileSync(SESSION_FILE, 'utf8').trim()
}

function writeAdmin(user) {
  fs.mkdirSync(path.dirname(ADMIN_FILE), { recursive: true })
  fs.writeFileSync(ADMIN_FILE, JSON.stringify({
    userId: idToString(user.id),
    username: user.username || null,
    firstName: user.firstName || null,
    savedAt: new Date().toISOString(),
  }, null, 2), 'utf8')
}

function peerUserId(message) {
  const peer = message?.peerId
  if (!peer) return ''
  if (peer.className && peer.className !== 'PeerUser') return ''
  if (peer.channelId != null || peer.chatId != null) return ''
  return idToString(peer.userId)
}

function createClient(sessionText) {
  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = String(process.env.TELEGRAM_API_HASH || '').trim()
  if (!Number.isFinite(apiId) || apiId <= 0 || !apiHash) return null
  return new TelegramClient(new StringSession(sessionText), apiId, apiHash, {
    connectionRetries: 5,
  })
}

async function onMessage(event) {
  const message = event.message
  if (!message || !client) return

  const text = String(message.message || '').trim()
  if (!text) return

  const myId = myUserId
  const peerId = peerUserId(message)
  if (!peerId) return

  const dedupeKey = `${peerId}:${idToString(message.id)}`
  if (seenMessages.has(dedupeKey)) return
  seenMessages.add(dedupeKey)
  if (seenMessages.size > 500) seenMessages.clear()

  const isSaved = peerId === myId
  if (isSaved) {
    if (text.toLowerCase().startsWith('/bugun')) {
      const reply = await handleAdminToday()
      await client.sendMessage('me', { message: reply })
    }
    return
  }

  if (message.out) return

  const sender = await message.getSender().catch(() => null)
  const reply = await handlePatientMessage({
    telegramUserId: peerId,
    text,
    from: sender,
  })
  if (!reply) return
  await client.sendMessage(peerId, { message: reply })
}

async function startUserAgent() {
  const apiId = Number(process.env.TELEGRAM_API_ID)
  const apiHash = String(process.env.TELEGRAM_API_HASH || '').trim()
  if (!Number.isFinite(apiId) || apiId <= 0 || !apiHash) {
    console.log('Shaxsiy Telegram agent o\'chiq: TELEGRAM_API_ID yoki TELEGRAM_API_HASH yo\'q')
    return null
  }

  const sessionText = readSession()
  if (!sessionText) {
    console.warn('Shaxsiy Telegram sessiyasi yo\'q. telegram-bot papkasida: npm run agent:login')
    return null
  }

  const role = supabaseKeyRole()
  if (role && role !== 'service_role') {
    console.warn('SUPABASE_SERVICE_KEY service_role emas. Bemor yozuvi rad etilishi mumkin.')
  }

  client = createClient(sessionText)
  await client.connect()
  const authorized = await client.checkAuthorization()
  if (!authorized) {
    console.warn('Sessiya eskirgan. Qayta kiring: npm run agent:login')
    await client.disconnect()
    client = null
    return null
  }

  const me = await client.getMe()
  myUserId = idToString(me.id)
  writeAdmin(me)
  console.log(`Shaxsiy Telegram agent ulandi. Admin user id: ${myUserId}`)

  client.addEventHandler((event) => {
    onMessage(event).catch((error) => {
      console.error('Shaxsiy agent xabari:', error.message)
    })
  }, new NewMessage({}))

  return client
}

async function stopUserAgent() {
  if (!client) return
  const current = client
  client = null
  myUserId = ''
  await current.disconnect().catch(() => {})
}

module.exports = {
  startUserAgent,
  stopUserAgent,
  idToString,
  SESSION_FILE,
  ADMIN_FILE,
  createClient,
  writeAdmin,
}
