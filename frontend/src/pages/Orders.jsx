import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import apiFetch from '../utils/api'
import '../styles/Orders.css'

export default function Orders() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all') // all | active | past
  const [timeFilter, setTimeFilter] = useState('all') // all | 30 | 90 | 365
  
  useEffect(() => {
    loadOrders()
  }, [user])

  // Auto-refresh when window gains focus, tab becomes visible, and every 10s
  useEffect(() => {
    if (!user) return
    const onFocus = () => loadOrders()
    const onVisibility = () => { if (!document.hidden) loadOrders() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    const intervalId = setInterval(() => loadOrders(), 10000)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(intervalId)
    }
  }, [user])

  const loadOrders = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      const data = await apiFetch(`/api/orders/user/${user._id || user.id}?t=${Date.now()}`)
      setOrders(data)
    } catch (err) {
      console.error('Failed to load orders', err)
    } finally {
      setLoading(false)
    }
  }
  
  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#f59e0b',
      'Processing': '#3b82f6',
      'Shipped': '#8b5cf6',
      'Delivered': '#10b981',
      'Cancelled': '#ef4444'
    }
    return colors[status] || '#718096'
  }

  const isActiveStatus = (s) => ['Pending','Processing','Shipped'].includes(s)
  const isPastStatus = (s) => ['Delivered','Cancelled'].includes(s)

  const filteredOrders = orders.filter(o => {
    if (statusFilter === 'active' && !isActiveStatus(o.status)) return false
    if (statusFilter === 'past' && !isPastStatus(o.status)) return false
    if (timeFilter !== 'all') {
      const days = parseInt(timeFilter, 10)
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
      if (new Date(o.orderDate).getTime() < cutoff) return false
    }
    return true
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="orders-page">
      {/* Header */}
      <header className="orders-header">
        <div className="orders-header-content">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>My Orders</h1>
          <button className="continue-shopping-btn" onClick={loadOrders} style={{ marginLeft: 'auto' }}>
            Refresh
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="orders-container">
        <div className="orders-filters">
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Orders</option>
            <option value="active">Active (Pending/Processing/Shipped)</option>
            <option value="past">Past (Delivered/Cancelled)</option>
          </select>
          <select className="filter-select" value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
            <option value="all">All time</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Orders Content */}
      <div className="orders-container">
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-orders">
            <div className="empty-orders-icon">📦</div>
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders here!</p>
            <button className="continue-shopping-btn" onClick={() => navigate('/dashboard')}>
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order._id} className="order-card">
                {/* Order Header */}
                <div className="order-header">
                  <div className="order-header-left">
                    <h3>Order #{order._id.slice(-8)}</h3>
                    <p className="order-date">
                      Placed on {formatDate(order.orderDate)} at {formatTime(order.orderDate)}
                    </p>
                  </div>
                  <div className="order-header-right">
                    <div className="order-status-badge" style={{ background: getStatusColor(order.status) }}>
                      {order.status}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="order-item-image">
                        {String(item.image).startsWith('http') ? (
                          <img src={item.image} alt={item.name} className="order-item-img" />
                        ) : (
                          <span className="order-item-emoji">{item.image || '📦'}</span>
                        )}
                      </div>
                      <div className="order-item-details">
                        <h4>{item.name}</h4>
                        <p>{item.description || ''}</p>
                        <div className="order-item-meta">
                          <span>Qty: {item.quantity}</span>
                          <span>₹{item.price} each</span>
                        </div>
                      </div>
                      <div className="order-item-price">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="order-footer">
                  <div className="order-footer-info">
                    {order.estimatedDelivery && (
                      <div className="delivery-info">
                        <span className="delivery-label">Estimated Delivery:</span>
                        <span className="delivery-date">{formatDate(order.estimatedDelivery)}</span>
                      </div>
                    )}
                    {order.deliveryBoy && order.deliveryBoy.name && (
                      <div className="delivery-boy-info">
                        <span className="delivery-label">Delivery Boy:</span>
                        <span className="delivery-value">{order.deliveryBoy.name} ({order.deliveryBoy.contact})</span>
                      </div>
                    )}
                    {order.deliveryCharges !== undefined && order.deliveryCharges !== null && (
                      <div className="delivery-charges-info">
                        <span className="delivery-label">Delivery Charge:</span>
                        <span className="delivery-value">₹{order.deliveryCharges}</span>
                      </div>
                    )}
                    <div className="order-total">
                      <span className="total-label">Total Amount:</span>
                      <span className="total-amount">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
