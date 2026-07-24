const BASE = import.meta.env.VITE_API_BASE || '/api'

function getToken() {
  return localStorage.getItem('vg_token')
}

function setToken(token) {
  localStorage.setItem('vg_token', token)
}

function clearToken() {
  localStorage.removeItem('vg_token')
  localStorage.removeItem('vg_username')
  localStorage.removeItem('vg_userId')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, { ...options, headers })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }
  return data
}

export const api = {
  register: async (username, password) => {
    const data = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    setToken(data.token)
    localStorage.setItem('vg_username', data.username)
    localStorage.setItem('vg_userId', data.userId)
    return data
  },

  login: async (username, password) => {
    const data = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    setToken(data.token)
    localStorage.setItem('vg_username', data.username)
    localStorage.setItem('vg_userId', data.userId)
    return data
  },

  logout: () => {
    clearToken()
  },

  getIteration: () => request('/iteration'),

  saveIteration: (data) => request('/iteration', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  archive: () => request('/archive', { method: 'POST' }),

  getArchives: () => request('/archives'),

  deleteArchive: (id) => request(`/archives/${id}`, { method: 'DELETE' }),

  updateArchive: (id, data) => request(`/archives/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  me: () => request('/me'),

  // Check if backend server is available
  checkServer: async () => {
    try {
      const res = await fetch(BASE + '/me', { method: 'GET' })
      const ct = res.headers.get('content-type') || ''
      // Must be JSON response from our API (not a 404 HTML page)
      if (!ct.includes('application/json')) return false
      return res.status < 500
    } catch {
      return false
    }
  },

  isLoggedIn: () => !!getToken(),

  getUsername: () => localStorage.getItem('vg_username') || '',
}
