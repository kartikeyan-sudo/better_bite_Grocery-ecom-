const RAW_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
const BASE_URL = RAW_BASE.replace(/\/+$/, '')

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('authToken')
  const headers = options.headers ? { ...options.headers } : {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(options.body)
  }

  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    ...options,
    headers
  })

  const text = await res.text()
  try {
    const data = text ? JSON.parse(text) : {}
    if (!res.ok) {
      const err = new Error(data.error || res.statusText || 'Request failed')
      err.status = res.status
      err.data = data
      throw err
    }
    return data
  } catch (err) {
    // If response wasn't JSON
    if (err instanceof SyntaxError) {
      if (!res.ok) throw new Error(res.statusText || 'Request failed')
      return text
    }
    throw err
  }
}

export default apiFetch
