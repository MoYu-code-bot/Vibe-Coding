import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // { userId, username }
  const [loading, setLoading] = useState(true)
  const [serverAvailable, setServerAvailable] = useState(true)

  // Check server availability and existing token on mount
  useEffect(() => {
    (async () => {
      const isServerUp = await api.checkServer()
      setServerAvailable(isServerUp)

      if (!isServerUp) {
        // No backend: skip login, use local mode
        setUser({ username: '本地用户', userId: 'local' })
        setLoading(false)
        return
      }

      // Backend available: check existing token
      if (api.isLoggedIn()) {
        try {
          const me = await api.me()
          setUser({ username: me.username, userId: me.userId })
        } catch {
          api.logout()
          setUser(null)
        }
      }
      setLoading(false)
    })()
  }, [])

  const login = useCallback((result) => {
    setUser({ username: result.username, userId: result.userId })
  }, [])

  const logout = useCallback(() => {
    if (serverAvailable) {
      api.logout()
    }
    setUser(null)
  }, [serverAvailable])

  const value = {
    user,
    loading,
    isLoggedIn: !!user,
    serverAvailable,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
