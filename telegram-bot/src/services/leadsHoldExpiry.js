/**
 * Lead hold expiry — bot ichida zaxira cron (Edge Function bilan birga)
 */

const { supabase } = require('../supabase')

let intervalRef = null

async function runHoldCleanup() {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_lead_holds')
    if (error) {
      console.error('❌ Lead hold cleanup:', error.message)
      return { expired: 0, error: error.message }
    }
    const expired = Number(data) || 0
    if (expired > 0) {
      console.log(`🕐 Lead hold cleanup: ${expired} ta ariza expired`)
    }
    return { expired }
  } catch (err) {
    console.error('❌ Lead hold cleanup failed:', err.message)
    return { expired: 0, error: err.message }
  }
}

function startLeadHoldCleanupCron(intervalMs = 5 * 60 * 1000) {
  if (intervalRef) return

  runHoldCleanup()

  intervalRef = setInterval(() => {
    runHoldCleanup()
  }, intervalMs)

  console.log(`⏱️ Lead hold cleanup cron ishga tushdi (${intervalMs}ms)`)
}

function stopLeadHoldCleanupCron() {
  if (intervalRef) {
    clearInterval(intervalRef)
    intervalRef = null
  }
}

module.exports = {
  runHoldCleanup,
  startLeadHoldCleanupCron,
  stopLeadHoldCleanupCron,
}
