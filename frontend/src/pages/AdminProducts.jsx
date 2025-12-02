import React, { useState, useEffect } from 'react'
import adminApiFetch from '../utils/adminApi'
import AdminNav from '../components/AdminNav'
import '../styles/AdminDashboard.css'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    image: '',
    mrp: '',
    price: '',
    weight: '',
    quantity: '',
    description: '',
    inStock: true,
    recommended: false,
    purchaseLimit: ''
  })

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await adminApiFetch('/api/admin/categories')
      setCategories(data.filter(cat => cat.isActive))
    } catch (err) {
      console.error('Failed to load categories', err)
    }
  }

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
      mrp: product.mrp || '',
      price: product.price,
      weight: product.weight || '',
      quantity: product.quantity || '',
      description: product.description || '',
      inStock: product.inStock !== undefined ? product.inStock : true,
      recommended: product.recommended || false,
      purchaseLimit: product.purchaseLimit || ''
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
      mrp: '',
      price: '',
      weight: '',
      quantity: '',
      description: '',
      inStock: true,
      recommended: false,
      purchaseLimit: ''
    })
  }

  const openAddModal = () => {
    setEditingProduct(null)
    resetForm()
    setShowModal(true)
  }

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      product.name?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.weight?.toLowerCase().includes(query) ||
      product.price?.toString().includes(query) ||
      product.mrp?.toString().includes(query) ||
      (product.inStock ? 'in stock' : 'out of stock').includes(query) ||
      (product.recommended ? 'recommended' : '').includes(query)
    )
  })

  return (
    <div className="admin-container">
      <AdminNav />

      <main className="admin-main">
        <div className="page-header">
          <div>
            <h2 className="page-title">Product Management</h2>
            <p className="page-subtitle">Total Products: {products.length} {searchQuery && `(Showing ${filteredProducts.length} matches)`}</p>
          </div>
          <button onClick={openAddModal} className="btn-primary">
            ➕ Add Product
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-section" style={{ margin: '20px 0' }}>
          <div className="search-container" style={{ maxWidth: '600px' }}>
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#667eea' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search products by name, category, price, weight, stock status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                border: '2px solid #e0e7ff',
                borderRadius: '12px',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e7ff'}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#667eea',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>{searchQuery ? `No products found matching "${searchQuery}"` : 'No products yet. Add your first product!'}</p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-primary" style={{ marginTop: '12px' }}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price / MRP</th>
                    <th>Weight</th>
                    <th>Stock</th>
                    <th>Recommended</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {String(product.image).startsWith('http') ? (
                            <img src={product.image} alt={product.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                          ) : (
                            <span style={{ fontSize: 32 }}>{product.image || '📦'}</span>
                          )}
                        </div>
                      </td>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>
                        <div>
                          <span>₹{product.price}</span>
                          {product.mrp && Number(product.mrp) > Number(product.price) && (
                            <span style={{ marginLeft: 6, color: '#888', textDecoration: 'line-through' }}>₹{product.mrp}</span>
                          )}
                        </div>
                      </td>
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
                                  mrp: product.mrp || '',
                                  price: product.price,
                                  weight: product.weight || '',
                                  quantity: product.quantity || '',
                                  description: product.description || '',
                                  inStock: !product.inStock,
                                  recommended: product.recommended || false,
                                  purchaseLimit: product.purchaseLimit || null
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
                        <span className={`stock-badge ${product.recommended ? 'in-stock' : 'out-of-stock'}`}>
                          {product.recommended ? '⭐ Yes' : 'No'}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await adminApiFetch(`/api/admin/products/${product._id}`, {
                                method: 'PUT',
                                body: {
                                  name: product.name,
                                  category: product.category,
                                  image: product.image || '',
                                  mrp: product.mrp || '',
                                  price: product.price,
                                  weight: product.weight || '',
                                  quantity: product.quantity || '',
                                  description: product.description || '',
                                  inStock: product.inStock,
                                  recommended: !product.recommended,
                                  purchaseLimit: product.purchaseLimit || null
                                }
                              })
                              loadProducts()
                            } catch (err) {
                              console.error('Failed to toggle recommended', err)
                              alert('Failed to toggle recommended')
                            }
                          }}
                          className="btn-small"
                          style={{ marginLeft: '8px' }}
                        >
                          {product.recommended ? 'Remove' : 'Mark Recommended'}
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
              {filteredProducts.map(product => (
                <div key={product._id} className="product-card-admin">
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ flexShrink: 0 }}>
                      {String(product.image).startsWith('http') ? (
                        <img src={product.image} alt={product.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <span style={{ fontSize: 48 }}>{product.image || '📦'}</span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0' }}>{product.name}</h4>
                      <span className={`stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                  <p><strong>Category:</strong> {product.category}</p>
                  <p><strong>Price:</strong> ₹{product.price} {product.mrp && Number(product.mrp) > Number(product.price) && (
                    <span style={{ marginLeft: 6, color: '#888', textDecoration: 'line-through' }}>₹{product.mrp}</span>
                  )}</p>
                  <p><strong>Weight:</strong> {product.weight || 'N/A'}</p>
                  {product.description && <p><strong>Description:</strong> {product.description}</p>}
                  <p><strong>Recommended:</strong> {product.recommended ? '⭐ Yes' : 'No'}</p>
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
                              mrp: product.mrp || '',
                              price: product.price,
                              weight: product.weight || '',
                              quantity: product.quantity || '',
                              description: product.description || '',
                              inStock: !product.inStock,
                              recommended: product.recommended || false,
                              purchaseLimit: product.purchaseLimit || null
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
                    <button
                      onClick={async () => {
                        try {
                          await adminApiFetch(`/api/admin/products/${product._id}`, {
                            method: 'PUT',
                            body: {
                              name: product.name,
                              category: product.category,
                              image: product.image || '',
                              mrp: product.mrp || '',
                              price: product.price,
                              weight: product.weight || '',
                              quantity: product.quantity || '',
                              description: product.description || '',
                              inStock: product.inStock,
                              recommended: !product.recommended,
                              purchaseLimit: product.purchaseLimit || null
                            }
                          })
                          loadProducts()
                        } catch (err) {
                          console.error('Failed to toggle recommended', err)
                          alert('Failed to toggle recommended')
                        }
                      }}
                      className="btn-small"
                    >
                      {product.recommended ? '⭐ Remove' : '⭐ Add'}
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
                    {categories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
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
                  <label>MRP (₹)</label>
                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="e.g. 349"
                  />
                </div>
                <div className="form-group">
                  <label>Purchase Limit</label>
                  <input
                    type="number"
                    name="purchaseLimit"
                    value={formData.purchaseLimit}
                    onChange={handleChange}
                    min="1"
                    placeholder="Max qty per user"
                  />
                  <small style={{ color: '#888', fontSize: '12px' }}>Leave empty for no limit</small>
                </div>
              </div>

              <div className="form-row">
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
                    placeholder="🍚 or https://..."
                  />
                  
                  {/* Image Preview */}
                  {formData.image && (
                    <div style={{ marginTop: 12, padding: 12, background: '#f7fafc', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: '#718096', marginBottom: 8, fontWeight: 600 }}>Preview:</div>
                      {String(formData.image).startsWith('http') ? (
                        <img 
                          src={formData.image} 
                          alt="Preview" 
                          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '2px solid #e2e8f0' }} 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'block';
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 80 }}>{formData.image}</span>
                      )}
                      <div style={{ display: 'none', color: '#e53e3e', fontSize: 12, marginTop: 8 }}>Failed to load image</div>
                    </div>
                  )}
                  
                  <div style={{ marginTop: 8 }}>
                    <label 
                      htmlFor="image-upload" 
                      style={{ 
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#48bb78',
                        color: 'white',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#38a169'}
                      onMouseOut={(e) => e.target.style.background = '#48bb78'}
                    >
                      📤 Upload Image
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const fd = new FormData()
                          fd.append('file', file)
                          const res = await adminApiFetch('/api/admin/uploads/image', {
                            method: 'POST',
                            body: fd
                          })
                          setFormData(prev => ({ ...prev, image: res.url }))
                        } catch (err) {
                          console.error('Image upload failed', err)
                          alert(err.message || 'Image upload failed')
                        } finally {
                          e.target.value = ''
                        }
                      }}
                    />
                  </div>
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

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="recommended"
                    checked={formData.recommended}
                    onChange={handleChange}
                  />
                  ⭐ Mark as Recommended
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
