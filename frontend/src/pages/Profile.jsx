import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/Profile.css'

export default function Profile() {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  
  const [userData, setUserData] = useState({
    name: 'John Doe',
    username: 'johndoe123',
    email: 'john@example.com',
    phone: '+91 98765 43210',
    avatar: '👤'
  })

  const [editData, setEditData] = useState({ ...userData })

  const avatarOptions = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '🧔', '👱', '👨‍🦰', '👩‍🦰']

  const handleEditToggle = () => {
    if (isEditing) {
      // Save changes
      setUserData({ ...editData })
      setIsEditing(false)
    } else {
      // Start editing
      setEditData({ ...userData })
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setEditData({ ...userData })
    setIsEditing(false)
  }

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    })
  }

  const handleAvatarSelect = (avatar) => {
    setEditData({ ...editData, avatar })
    setShowAvatarModal(false)
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <div className="profile-header-content">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>My Profile</h1>
        </div>
      </header>

      {/* Profile Content */}
      <div className="profile-container">
        <div className="profile-card">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              <div className="avatar-circle">
                <span className="avatar-emoji">{isEditing ? editData.avatar : userData.avatar}</span>
              </div>
              {isEditing && (
                <button 
                  className="change-avatar-btn"
                  onClick={() => setShowAvatarModal(true)}
                >
                  📷 Change Avatar
                </button>
              )}
            </div>
          </div>

          {/* User Info Section */}
          <div className="profile-info-section">
            <div className="info-row">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editData.name}
                  onChange={handleChange}
                  className="edit-input"
                />
              ) : (
                <p className="info-value">{userData.name}</p>
              )}
            </div>

            <div className="info-row">
              <label>Username</label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={editData.username}
                  onChange={handleChange}
                  className="edit-input"
                />
              ) : (
                <p className="info-value">@{userData.username}</p>
              )}
            </div>

            <div className="info-row">
              <label>Email Address</label>
              <p className="info-value">{userData.email}</p>
              <span className="info-note">Email cannot be changed</span>
            </div>

            <div className="info-row">
              <label>Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={editData.phone}
                  onChange={handleChange}
                  className="edit-input"
                />
              ) : (
                <p className="info-value">{userData.phone}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions">
            {isEditing ? (
              <>
                <button className="btn-save" onClick={handleEditToggle}>
                  💾 Save Changes
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="btn-edit" onClick={handleEditToggle}>
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {/* Quick Links */}
          <div className="quick-links">
            <h3>Quick Links</h3>
            <Link to="/orders" className="quick-link-item">
              <span>📦</span> My Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Choose Your Avatar</h2>
              <button className="modal-close" onClick={() => setShowAvatarModal(false)}>
                ✕
              </button>
            </div>
            <div className="avatar-grid">
              {avatarOptions.map((avatar, index) => (
                <button
                  key={index}
                  className={`avatar-option ${editData.avatar === avatar ? 'selected' : ''}`}
                  onClick={() => handleAvatarSelect(avatar)}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
