const fs = require('fs')
const readline = require('readline')
const { loadEnv } = require('./env')

loadEnv()

const {
  createClient,
  writeAdmin,
  idToString,
  SESSION_FILE,
} = require('./client')

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(String(answer || '').trim())
    })
  })
}

async function main() {
  const client = createClient('')
  if (!client) {
    console.error('TELEGRAM_API_ID va TELEGRAM_API_HASH .env da bo\'lishi kerak.')
    process.exit(1)
  }

  console.log('Shaxsiy Telegram hisobiga bir martalik kirish. Kod Telegram ilovasiga keladi.')

  await client.start({
    phoneNumber: async () => ask('Telefon (+998...): '),
    phoneCode: async () => ask('Telegram kodi: '),
    password: async () => ask('Ikki bosqichli parol (yo\'q bo\'lsa bo\'sh): '),
    onError: (error) => {
      console.error(error?.message || error)
      return false
    },
  })

  const session = client.session.save()
  fs.writeFileSync(SESSION_FILE, session, 'utf8')

  const me = await client.getMe()
  writeAdmin(me)
  console.log(`Sessiya saqlandi. Admin user id: ${idToString(me.id)}`)
  console.log('Endi agentni ishga tushiring: npm start')
  await client.disconnect()
}

main().catch((error) => {
  console.error('Kirish amalga oshmadi:', error.message)
  process.exit(1)
})
