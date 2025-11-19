import React, { useState, useEffect } from 'react'
import adminApiFetch from '../utils/adminApi'
import AdminNav from '../components/AdminNav'
import '../styles/AdminDashboard.css'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const data = await adminApiFetch('/api/admin/orders')
      setOrders(data)
    } catch (err) {
      console.error('Failed to load orders', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await adminApiFetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status: newStatus }
      })
      loadOrders()
    } catch (err) {
      console.error('Failed to update order status', err)
      alert('Failed to update order status')
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
    return colors[status] || '#6b7280'
  }

  return (
    <div className="admin-container">
      <AdminNav />

      <main className="admin-main">
        <div className="page-header">
          <h2 className="page-title">Order Management</h2>
          <p className="page-subtitle">Total Orders: {orders.length}</p>
        </div>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet.</p>
          </div>
        ) : (
          <div className="orders-list-admin">
            {orders.map(order => (
              <div key={order._id} className="order-card-admin">
                <div className="order-header-admin">
                  <div>
                    <h3>Order #{order._id.slice(-8)}</h3>
                    <p className="order-customer">
                      Customer: {order.userId?.name || 'Unknown'} ({order.userId?.email || 'N/A'})
                    </p>
                    <p className="order-date">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="order-status-control">
                    <label>Status:</label>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="status-select"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {order.shippingAddress && (
                  <div className="shipping-address-admin">
                    <strong>📍 Shipping Address:</strong>
                    <p>{order.shippingAddress.fullName} • {order.shippingAddress.phone}</p>
                    <p>{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                  </div>
                )}

                <div className="estimated-delivery-admin" style={{ marginTop: '12px', padding: '12px', background: '#f0f9ff', borderRadius: '8px' }}>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', color: '#0369a1' }}>🚚 Estimated Delivery:</label>
                  <input
                    type="datetime-local"
                    value={order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().slice(0, 16) : ''}
                    onChange={async (e) => {
                      const newDate = e.target.value ? new Date(e.target.value).toISOString() : null
                      try {
                        await adminApiFetch(`/api/admin/orders/${order._id}/delivery`, {
                          method: 'PUT',
                          body: { estimatedDelivery: newDate }
                        })
                        loadOrders()
                      } catch (err) {
                        console.error('Failed to update delivery date', err)
                        alert('Failed to update delivery date')
                      }
                    }}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #0ea5e9', fontSize: '14px', width: '100%', maxWidth: '300px' }}
                  />
                  {order.estimatedDelivery && (
                    <p style={{ marginTop: '6px', fontSize: '13px', color: '#0369a1' }}>
                      📅 {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(order.estimatedDelivery).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>

                <div className="order-items-admin">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item-admin">
                      <div className="item-image">
                        {String(item.image).startsWith('http') ? (
                          <img src={item.image} alt={item.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                        ) : (
                          <span style={{ fontSize: 28 }}>{item.image || '📦'}</span>
                        )}
                      </div>
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">x{item.quantity}</span>
                      <span className="item-price">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="order-footer-admin">
                  <strong>Total: ₹{order.total}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
