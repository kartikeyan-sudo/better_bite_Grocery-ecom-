import React, { useState, useEffect } from 'react'
import adminApiFetch from '../utils/adminApi'
import AdminNav from '../components/AdminNav'
import '../styles/AdminDashboard.css'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    image: '',
    price: '',
    weight: '',
    quantity: '',
    description: '',
    inStock: true
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await adminApiFetch('/api/admin/products')
      setProducts(data)
    } catch (err) {
      console.error('Failed to load products', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await adminApiFetch(`/api/admin/products/${editingProduct._id}`, {
          method: 'PUT',
          body: formData
        })
      } else {
        await adminApiFetch('/api/admin/products', {
          method: 'POST',
          body: formData
        })
      }
      setShowModal(false)
      setEditingProduct(null)
      resetForm()
      loadProducts()
    } catch (err) {
      console.error('Failed to save product', err)
      alert(err.message || 'Failed to save product')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      image: product.image || '',
      price: product.price,
      weight: product.weight || '',
      quantity: product.quantity || '',
      description: product.description || '',
      inStock: product.inStock !== undefined ? product.inStock : true
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await adminApiFetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      loadProducts()
    } catch (err) {
      console.error('Failed to delete product', err)
      alert('Failed to delete product')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      image: '',
      price: '',
      weight: '',
      quantity: '',
      description: '',
      inStock: true
    })
  }

  const openAddModal = () => {
    setEditingProduct(null)
    resetForm()
    setShowModal(true)
  }

  return (
    <div className="admin-container">
      <AdminNav />

      <main className="admin-main">
        <div className="page-header">
          <div>
            <h2 className="page-title">Product Management</h2>
            <p className="page-subtitle">Total Products: {products.length}</p>
          </div>
          <button onClick={openAddModal} className="btn-primary">
            ➕ Add Product
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No products yet. Add your first product!</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Weight</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>₹{product.price}</td>
                      <td>{product.weight || 'N/A'}</td>
                      <td>
                        <span className={`stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await adminApiFetch(`/api/admin/products/${product._id}` , {
                                method: 'PUT',
                                body: { 
                                  name: product.name,
                                  category: product.category,
                                  image: product.image || '',
                                  price: product.price,
                                  weight: product.weight || '',
                                  quantity: product.quantity || '',
                                  description: product.description || '',
                                  inStock: !product.inStock 
                                }
                              })
                              loadProducts()
                            } catch (err) {
                              console.error('Failed to toggle stock', err)
                              alert('Failed to toggle stock')
                            }
                          }}
                          className="btn-small"
                          style={{ marginLeft: '8px' }}
                        >
                          {product.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => handleEdit(product)} className="btn-edit">Edit</button>
                        <button onClick={() => handleDelete(product._id)} className="btn-delete">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="product-cards">
              {products.map(product => (
                <div key={product._id} className="product-card-admin">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h4>{product.name}</h4>
                    <span className={`stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <p><strong>Category:</strong> {product.category}</p>
                  <p><strong>Price:</strong> ₹{product.price}</p>
                  <p><strong>Weight:</strong> {product.weight || 'N/A'}</p>
                  {product.description && <p><strong>Description:</strong> {product.description}</p>}
                  <div className="product-card-actions">
                    <button
                      onClick={async () => {
                        try {
                          await adminApiFetch(`/api/admin/products/${product._id}`, {
                            method: 'PUT',
                            body: {
                              name: product.name,
                              category: product.category,
                              image: product.image || '',
                              price: product.price,
                              weight: product.weight || '',
                              quantity: product.quantity || '',
                              description: product.description || '',
                              inStock: !product.inStock
                            }
                          })
                          loadProducts()
                        } catch (err) {
                          console.error('Failed to toggle stock', err)
                          alert('Failed to toggle stock')
                        }
                      }}
                      className="btn-small"
                    >
                      {product.inStock ? 'Mark Out' : 'Mark In'}
                    </button>
                    <button onClick={() => handleEdit(product)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(product._id)} className="btn-delete">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} required>
                    <option value="">Select Category</option>
                    <option value="Food">Food</option>
                    <option value="Cook">Cook</option>
                    <option value="Wash">Wash</option>
                    <option value="Care">Care</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dairy">Dairy</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Weight</label>
                  <input
                    type="text"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g. 1 kg"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity/Pack</label>
                  <input
                    type="text"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g. Pack of 1"
                  />
                </div>
                <div className="form-group">
                  <label>Image (emoji or URL)</label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="🍚"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="inStock"
                    checked={formData.inStock}
                    onChange={handleChange}
                  />
                  In Stock
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update' : 'Create'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
