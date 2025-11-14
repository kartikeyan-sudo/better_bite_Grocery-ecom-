import React, { createContext, useContext, useEffect, useState } from 'react'

const AdminAuthContext = createContext()

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return context
}

export const AdminAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const savedAuth = localStorage.getItem('adminIsAuthenticated')
    const savedUser = localStorage.getItem('adminUser')
    const savedToken = localStorage.getItem('adminAuthToken')
    if (savedAuth === 'true' && savedUser) {
      setIsAuthenticated(true)
      setUser(JSON.parse(savedUser))
      if (savedToken) setToken(savedToken)
    }
  }, [])

  const login = (userData, jwtToken) => {
    setIsAuthenticated(true)
    setUser(userData)
    setToken(jwtToken || null)
    localStorage.setItem('adminIsAuthenticated', 'true')
    localStorage.setItem('adminUser', JSON.stringify(userData))
    if (jwtToken) localStorage.setItem('adminAuthToken', jwtToken)
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    setToken(null)
    localStorage.removeItem('adminIsAuthenticated')
    localStorage.removeItem('adminUser')
    localStorage.removeItem('adminAuthToken')
  }

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
