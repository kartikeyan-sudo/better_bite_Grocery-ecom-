import React, { useState, useEffect } from 'react'
import adminApiFetch from '../utils/adminApi'
import AdminNav from '../components/AdminNav'
import '../styles/AdminDashboard.css'

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    icon: '📦',
    bannerImage: '',
    displayOrder: 0,
    isActive: true
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await adminApiFetch('/api/admin/categories')
      setCategories(data)
    } catch (err) {
      console.error('Failed to load categories', err)
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
      if (editingCategory) {
        await adminApiFetch(`/api/admin/categories/${editingCategory._id}`, {
          method: 'PUT',
          body: formData
        })
      } else {
        await adminApiFetch('/api/admin/categories', {
          method: 'POST',
          body: formData
        })
      }
      setShowModal(false)
      setEditingCategory(null)
      resetForm()
      loadCategories()
    } catch (err) {
      console.error('Failed to save category', err)
      alert(err.message || 'Failed to save category')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon || '📦',
      bannerImage: category.bannerImage || '',
      displayOrder: category.displayOrder || 0,
      isActive: category.isActive !== undefined ? category.isActive : true
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await adminApiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      loadCategories()
    } catch (err) {
      console.error('Failed to delete category', err)
      alert('Failed to delete category')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '📦',
      bannerImage: '',
      displayOrder: 0,
      isActive: true
    })
  }

  const openAddModal = () => {
    resetForm()
    setEditingCategory(null)
    setShowModal(true)
  }

  // Filter categories based on search query
  const filteredCategories = categories.filter(category => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      category.name?.toLowerCase().includes(query) ||
      category.icon?.includes(query) ||
      category.displayOrder?.toString().includes(query) ||
      (category.isActive ? 'active' : 'inactive').includes(query)
    )
  })

  return (
    <div className="admin-container">
      <AdminNav />

      <main className="admin-main">
        <div className="page-header">
          <div>
            <h2 className="page-title">Category Management</h2>
            <p className="page-subtitle">Total Categories: {categories.length} {searchQuery && `(Showing ${filteredCategories.length} matches)`}</p>
          </div>
          <button className="btn-primary" onClick={openAddModal}>+ Add Category</button>
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
              placeholder="Search categories by name, status, order..."
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
          <div className="loading">Loading categories...</div>
        ) : filteredCategories.length === 0 ? (
          <div className="empty-state">
            <p>{searchQuery ? `No categories found matching "${searchQuery}"` : 'No categories yet. Add your first category!'}</p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-primary" style={{ marginTop: '12px' }}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="categories-grid">
            {filteredCategories.map(category => (
              <div key={category._id} className="category-card">
                <div className="category-banner">
                  {category.bannerImage ? (
                    <img src={category.bannerImage} alt={category.name} className="category-banner-img" />
                  ) : (
                    <div className="category-banner-placeholder">
                      <span className="category-icon-large">{category.icon}</span>
                    </div>
                  )}
                  <div className="category-overlay">
                    <h3>{category.name}</h3>
                  </div>
                </div>
                <div className="category-card-footer">
                  <div className="category-info">
                    <span className="category-icon">{category.icon}</span>
                    <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="display-order">Order: {category.displayOrder}</span>
                  </div>
                  <div className="category-actions">
                    <button onClick={() => handleEdit(category)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(category._id)} className="btn-delete">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Fruits & Vegetables"
                  />
                </div>

                <div className="form-group">
                  <label>Icon (emoji)</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleChange}
                    placeholder=""
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Banner Image (URL or upload)</label>
                  <input
                    type="text"
                    name="bannerImage"
                    value={formData.bannerImage}
                    onChange={handleChange}
                    placeholder="https://... or use upload below"
                  />
                  
                  {/* Image Preview */}
                  {formData.bannerImage && (
                    <div className="image-preview-container">
                      <div className="preview-label">Preview:</div>
                      <div className="category-preview">
                        <img src={formData.bannerImage} alt="Preview" className="category-preview-img" />
                        <div className="category-preview-overlay">
                          <h4>{formData.name || 'Category Name'}</h4>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div style={{ marginTop: 12 }}>
                    <label 
                      htmlFor="banner-upload" 
                      className="upload-btn"
                    >
                      📤 Upload Banner Image
                    </label>
                    <input
                      id="banner-upload"
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
                          setFormData(prev => ({ ...prev, bannerImage: res.url }))
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

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingCategory ? 'Update' : 'Add'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
