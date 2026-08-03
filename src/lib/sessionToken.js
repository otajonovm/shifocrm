const SESSION_KEY = 'shifocrm-secure-session'

let memorySession = null

export const readSecureSession = () => {
  if (memorySession) return memorySession
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    memorySession = raw ? JSON.parse(raw) : null
    return memorySession
  } catch {
    return null
  }
}

export const writeSecureSession = (session) => {
  memorySession = session || null
  if (typeof window === 'undefined') return
  if (session) {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    window.sessionStorage.removeItem(SESSION_KEY)
  }
}

export const readAccessToken = () => {
  const session = readSecureSession()
  if (!session?.access_token || !session?.expires_at) return null
  if (Date.now() >= Number(session.expires_at) * 1000) {
    writeSecureSession(null)
    return null
  }
  return session.access_token
}
