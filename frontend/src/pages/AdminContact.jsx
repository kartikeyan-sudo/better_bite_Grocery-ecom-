import React, { useState, useEffect } from 'react'
import adminApiFetch from '../utils/adminApi'
import AdminNav from '../components/AdminNav'
import '../styles/AdminDashboard.css'

export default function AdminContact() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    whatsapp: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    mondayToFriday: '9:00 AM - 8:00 PM',
    saturday: '9:00 AM - 6:00 PM',
    sunday: '10:00 AM - 4:00 PM',
    facebook: '',
    instagram: '',
    twitter: '',
    googleMapUrl: '',
    description: ''
  })

  useEffect(() => {
    loadContact()
  }, [])

  const loadContact = async () => {
    try {
      const data = await adminApiFetch('/api/admin/contact')
      if (data && data.businessName) {
        setFormData(data)
      }
    } catch (err) {
      console.error('Failed to load contact info', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminApiFetch('/api/admin/contact', {
        method: 'PUT',
        body: formData
      })
      alert('Contact information updated successfully!')
    } catch (err) {
      console.error('Failed to save contact info', err)
      alert(err.message || 'Failed to save contact information')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-container">
        <AdminNav />
        <main className="admin-main">
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <AdminNav />
      <main className="admin-main">
        <div className="admin-header">
          <h2>Contact Information</h2>
          <p>Manage your business contact details</p>
        </div>

        <div className="contact-form-container">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-section">
              <h3>📋 Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Business Name *</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                    placeholder="Better Bite"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="info@betterbite.com"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="form-group">
                  <label>Alternate Phone</label>
                  <input
                    type="text"
                    name="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    placeholder="+91 98765 43211"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    placeholder="+919876543210 (with country code, no spaces)"
                  />
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Format: Country code + number (e.g., +919876543210)
                  </small>
                </div>
                <div className="form-group"></div>
              </div>
            </div>

            <div className="form-section">
              <h3>📍 Address</h3>
              <div className="form-group">
                <label>Street Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows="2"
                  placeholder="123 Market Street, Near City Mall"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    placeholder="Mumbai"
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    placeholder="Maharashtra"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    required
                    placeholder="400001"
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="India"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>🕐 Business Hours</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Monday - Friday</label>
                  <input
                    type="text"
                    name="mondayToFriday"
                    value={formData.mondayToFriday}
                    onChange={handleChange}
                    placeholder="9:00 AM - 8:00 PM"
                  />
                </div>
                <div className="form-group">
                  <label>Saturday</label>
                  <input
                    type="text"
                    name="saturday"
                    value={formData.saturday}
                    onChange={handleChange}
                    placeholder="9:00 AM - 6:00 PM"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sunday</label>
                  <input
                    type="text"
                    name="sunday"
                    value={formData.sunday}
                    onChange={handleChange}
                    placeholder="10:00 AM - 4:00 PM"
                  />
                </div>
                <div className="form-group"></div>
              </div>
            </div>

            <div className="form-section">
              <h3>🌐 Social Media & Maps</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Facebook URL</label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    placeholder="https://facebook.com/betterbite"
                  />
                </div>
                <div className="form-group">
                  <label>Instagram URL</label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    placeholder="https://instagram.com/betterbite"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Twitter URL</label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    placeholder="https://twitter.com/betterbite"
                  />
                </div>
                <div className="form-group">
                  <label>Google Maps URL</label>
                  <input
                    type="url"
                    name="googleMapUrl"
                    value={formData.googleMapUrl}
                    onChange={handleChange}
                    placeholder="https://maps.google.com/?q=..."
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>📝 Description</h3>
              <div className="form-group">
                <label>Business Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Tell customers about your business..."
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Contact Information'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
