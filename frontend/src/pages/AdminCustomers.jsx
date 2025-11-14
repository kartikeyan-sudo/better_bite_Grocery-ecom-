import React, { useState, useEffect } from 'react'
import adminApiFetch from '../utils/adminApi'
import AdminNav from '../components/AdminNav'
import '../styles/AdminDashboard.css'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const data = await adminApiFetch('/api/admin/customers')
      setCustomers(data)
    } catch (err) {
      console.error('Failed to load customers', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleBlock = async (customer) => {
    if (!customer?._id && !customer?.id) return
    const id = customer._id || customer.id
    setSavingId(id)
    try {
      await adminApiFetch(`/api/admin/customers/${id}/block`, {
        method: 'PUT',
        body: { blocked: !customer.isBlocked }
      })
      await loadCustomers()
    } catch (err) {
      console.error('Failed to update customer block status', err)
      alert(err.message || 'Failed to update customer')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="admin-container">
      <AdminNav />

      <main className="admin-main">
        <div className="page-header">
          <h2 className="page-title">Customer Management</h2>
          <p className="page-subtitle">Total Customers: {customers.length}</p>
        </div>

        {loading ? (
          <div className="loading">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <p>No customers registered yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr key={customer._id}>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || 'N/A'}</td>
                      <td>
                        <span className={`stock-badge ${customer.isBlocked ? 'out-of-stock' : 'in-stock'}`}>
                          {customer.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => toggleBlock(customer)}
                          disabled={savingId === (customer._id || customer.id)}
                        >
                          {customer.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="customer-cards">
              {customers.map(customer => (
                <div key={customer._id} className="customer-card">
                  <div className="customer-card-header">
                    <div className="customer-card-info">
                      <h4>{customer.name}</h4>
                      <p>📧 {customer.email}</p>
                      <p>📱 {customer.phone || 'N/A'}</p>
                      <p>📅 Joined {new Date(customer.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`stock-badge ${customer.isBlocked ? 'out-of-stock' : 'in-stock'}`}>
                      {customer.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                  <div className="customer-card-footer">
                    <button
                      className="btn-edit"
                      onClick={() => toggleBlock(customer)}
                      disabled={savingId === (customer._id || customer.id)}
                      style={{ width: '100%' }}
                    >
                      {customer.isBlocked ? 'Unblock Customer' : 'Block Customer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
