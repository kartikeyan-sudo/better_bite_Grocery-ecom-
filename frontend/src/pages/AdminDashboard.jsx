import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'
import adminApiFetch from '../utils/adminApi'
import AdminNav from '../components/AdminNav'
import '../styles/AdminDashboard.css'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAdminAuth()
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const data = await adminApiFetch('/api/admin/stats')
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="admin-container">
      <AdminNav />

      <main className="admin-main">
        <h2 className="page-title">Dashboard Overview</h2>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>Total Customers</h3>
                <p className="stat-number">{stats.totalCustomers}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>Total Products</h3>
                <p className="stat-number">{stats.totalProducts}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🛒</div>
              <div className="stat-info">
                <h3>Total Orders</h3>
                <p className="stat-number">{stats.totalOrders}</p>
              </div>
            </div>

            <div className="stat-card highlight">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>Pending Orders</h3>
                <p className="stat-number">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>
        )}

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <Link to="/admin/products" className="action-btn">
              <span>➕</span> Add New Product
            </Link>
            <Link to="/admin/orders" className="action-btn">
              <span>📋</span> Manage Orders
            </Link>
            <Link to="/admin/customers" className="action-btn">
              <span>👤</span> View Customers
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
