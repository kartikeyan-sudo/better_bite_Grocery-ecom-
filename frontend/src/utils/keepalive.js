const RAW_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
const BASE_URL = RAW_BASE.replace(/\/+$/, '')

// Ping interval: 2 minutes (120000ms)
const PING_INTERVAL = 2 * 60 * 1000

let intervalId = null

/**
 * Sends a lightweight ping request to keep the backend awake
 */
async function pingBackend() {
  try {
    // Use a simple GET request to a lightweight endpoint
    // If your backend has a health check endpoint, use that
    // Otherwise, we'll use the root endpoint
    await fetch(`${BASE_URL}/`, {
      method: 'HEAD', // HEAD request uses less bandwidth
      cache: 'no-cache'
    })
    console.log('[Keepalive] Backend pinged successfully')
  } catch (error) {
    // Silently fail - don't disrupt the user experience
    console.warn('[Keepalive] Ping failed:', error.message)
  }
}

/**
 * Start the keepalive interval
 */
export function startKeepalive() {
  if (intervalId) {
    console.warn('[Keepalive] Already running')
    return
  }
  
  console.log('[Keepalive] Started - pinging every 2 minutes')
  
  // Ping immediately on start
  pingBackend()
  
  // Then ping every 2 minutes
  intervalId = setInterval(pingBackend, PING_INTERVAL)
}

/**
 * Stop the keepalive interval
 */
export function stopKeepalive() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    console.log('[Keepalive] Stopped')
  }
}
