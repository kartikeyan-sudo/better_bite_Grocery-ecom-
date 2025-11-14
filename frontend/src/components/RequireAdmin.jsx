import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function RequireAdmin({ children }) {
  const location = useLocation()
  const { isAuthenticated, user } = useAdminAuth()

  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
