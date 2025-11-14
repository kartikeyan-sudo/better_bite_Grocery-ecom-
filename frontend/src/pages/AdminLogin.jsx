import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import adminApiFetch from '../utils/adminApi'
import '../styles/AdminLogin.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAdminAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      // Call backend login
      const data = await adminApiFetch('/api/auth/login', {
        method: 'POST',
        body: { email: formData.email, password: formData.password }
      })

      // Check if user is admin
      if (!data.user.isAdmin) {
        setError('Access denied. Admin privileges required.')
        setLoading(false)
        return
      }

      // data: { token, user } - store in admin session only
      login(data.user, data.token)

      // Redirect to admin dashboard
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-shield">🛡️</div>
          <h2>Admin Portal</h2>
          <p className="admin-login-subtitle">Secure access for administrators only</p>
        </div>
        
        {error && <div className="admin-error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@admin.com"
              required
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your admin password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Access Admin Panel'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p>🔒 This is a secure area for authorized personnel only</p>
          <a href="/" className="back-to-home">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}
