import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/Home.css'

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const handleShopClick = (e) => {
    e.preventDefault()
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/login')
    }
  }

  const categories = [
    { name: 'Fresh Fruits', icon: '🍎', color: '#ff6b6b' },
    { name: 'Vegetables', icon: '🥦', color: '#51cf66' },
    { name: 'Dairy & Eggs', icon: '🥛', color: '#748ffc' },
    { name: 'Bakery', icon: '🍞', color: '#ffd43b' },
    { name: 'Meat & Fish', icon: '🥩', color: '#ff8787' },
    { name: 'Beverages', icon: '🥤', color: '#74c0fc' }
  ]

  const features = [
    { icon: '🚚', title: 'Free Delivery', description: 'On orders over $50' },
    { icon: '🌱', title: 'Fresh Products', description: '100% organic & natural' },
    { icon: '💰', title: 'Best Prices', description: 'Guaranteed lowest prices' },
    { icon: '⚡', title: 'Fast Checkout', description: 'Quick & easy ordering' }
  ]

  return (
    <div className="home-container">
      {/* Header/Navbar */}
      <header className="navbar">
        <div className="nav-content">
          <div className="logo-container">
            <img src="/logo.jpg" alt="Better Bite Grocery" className="logo" />
            <span className="logo-text">Better Bite</span>
          </div>
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <a href="/shop" onClick={handleShopClick}>Shop</a>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="nav-actions">
            <Link to="/login" className="btn-outline">Login</Link>
            <Link to="/register" className="btn-primary-small">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h2 className="hero-title">Fresh Groceries Delivered to Your Door</h2>
          <p className="hero-subtitle">
            Shop from the comfort of your home and get farm-fresh produce, 
            organic products, and daily essentials delivered within hours.
          </p>
          <div className="hero-buttons">
            <a href="/shop" onClick={handleShopClick} className="btn-hero-primary">Start Shopping</a>
            <Link to="/about" className="btn-hero-secondary">Learn More</Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-image-placeholder">
            <span style={{ fontSize: '120px' }}>🛒</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <h2 className="section-title">Shop by Category</h2>
        <p className="section-subtitle">Browse our wide range of fresh groceries</p>
        <div className="categories-grid">
          {categories.map((category, index) => (
            <div 
              key={index} 
              className="category-card"
              style={{ borderTop: `4px solid ${category.color}` }}
            >
              <div className="category-icon">{category.icon}</div>
              <h3>{category.name}</h3>
              <a href="/shop" onClick={handleShopClick} className="category-link">Shop Now →</a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <h2>Ready to start shopping?</h2>
        <p>Join thousands of happy customers enjoying fresh groceries every day</p>
        <Link to="/register" className="btn-cta">Create Free Account</Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <img src="/logo.jpg" alt="Better Bite Grocery" className="footer-logo" />
            <p>Your trusted source for fresh, organic groceries delivered to your doorstep.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="/shop" onClick={handleShopClick}>Shop</a>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-section">
            <h4>Customer Service</h4>
            <Link to="/help">Help Center</Link>
            <Link to="/shipping">Shipping Info</Link>
            <Link to="/returns">Returns</Link>
          </div>
          <div className="footer-section">
            <h4>Contact Us</h4>
            <p>📧 support@betterbite.com</p>
            <p>📱 1-800-GROCERY</p>
            <Link to="/admin/login" style={{ color: '#48bb78', fontSize: '12px', marginTop: '8px', display: 'block' }}>🛡️ Admin Access</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Better Bite Grocery. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
