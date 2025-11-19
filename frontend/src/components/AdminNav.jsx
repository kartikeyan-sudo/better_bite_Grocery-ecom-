import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function AdminNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const navLinks = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/customers', label: 'Customers', icon: '👥' },
    { path: '/admin/products', label: 'Products', icon: '📦' },
    { path: '/admin/categories', label: 'Categories', icon: '🏷️' },
    { path: '/admin/orders', label: 'Orders', icon: '🛒' },
    { path: '/admin/contact', label: 'Contact', icon: '📞' }
  ]

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <>
      <nav className="admin-nav">
        <div className="admin-nav-content">
          <button 
            className="hamburger-btn" 
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="logo-container">
                    <img src="/logo.png" alt="Better Bites" className="admin-logo" />
            <span className="logo-text">Better Bites</span>
          </div>
          <div className="admin-nav-links">
            {navLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-nav-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={closeMenu}
      />

      {/* Mobile Sidebar */}
      <div className={`admin-mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <h2>🛡️ Admin Menu</h2>
          <button 
            className="close-nav-btn" 
            onClick={closeMenu}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className="mobile-nav-links">
          {navLinks.map(link => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
