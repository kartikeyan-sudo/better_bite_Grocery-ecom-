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
                    {order.estimatedDelivery && (
                      <p className="estimated-delivery" style={{ marginTop: '4px', color: '#0369a1', fontSize: '14px', fontWeight: '600' }}>
                        🚚 Estimated Delivery: {formatDate(order.estimatedDelivery)} at {formatTime(order.estimatedDelivery)}
                      </p>
                    )}
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
                  {/* Left Section - Delivery Details */}
                  <div className="order-footer-left">
                    {order.estimatedDelivery && (
                      <div className="delivery-info-box">
                        <div className="info-icon">📅</div>
                        <div className="info-content">
                          <span className="info-label">Estimated Delivery</span>
                          <span className="info-value">{formatDate(order.estimatedDelivery)}</span>
                        </div>
                      </div>
                    )}
                    {order.deliveryBoy && order.deliveryBoy.name && (
                      <div className="delivery-info-box">
                        <div className="info-icon">🚚</div>
                        <div className="info-content">
                          <span className="info-label">Delivery Boy</span>
                          <span className="info-value">{order.deliveryBoy.name}</span>
                          <span className="info-sub">📞 {order.deliveryBoy.contact}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Section - Price Breakdown */}
                  <div className="order-footer-right">
                    <div className="price-breakdown">
                      <div className="price-row">
                        <span className="price-label">Product Total</span>
                        <span className="price-value">₹{order.total.toFixed(2)}</span>
                      </div>
                      <div className="price-row">
                        <span className="price-label">Delivery Charge</span>
                        <span className="price-value" style={{ color: order.deliveryCharges !== undefined && order.deliveryCharges !== null ? '#10b981' : '#f59e0b', fontWeight: '600' }}>
                          {order.deliveryCharges !== undefined && order.deliveryCharges !== null 
                            ? `₹${order.deliveryCharges.toFixed(2)}` 
                            : 'Decision Pending'}
                        </span>
                      </div>
                      <div className="price-divider"></div>
                      <div className="price-row total-row">
                        <span className="price-label-total">Total Amount</span>
                        <span className="price-value-total">
                          {order.deliveryCharges !== undefined && order.deliveryCharges !== null
                            ? `₹${((order.total || 0) + (order.deliveryCharges || 0)).toFixed(2)}`
                            : `₹${(order.total || 0).toFixed(2)} + Delivery`}
                        </span>
                      </div>
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
