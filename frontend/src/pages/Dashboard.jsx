import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import apiFetch from '../utils/api'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { addToCart, getCartCount, showNotification, notificationProduct } = useCart()
  const { logout, user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [quantities, setQuantities] = useState({})

  const categories = [
    { name: 'All', icon: '🛒', color: '#48bb78' },
    { name: 'Food', icon: '🍕', color: '#f56565' },
    { name: 'Cook', icon: '🍳', color: '#ed8936' },
    { name: 'Wash', icon: '🧼', color: '#4299e1' },
    { name: 'Care', icon: '💆', color: '#9f7aea' },
    { name: 'Drinks', icon: '🥤', color: '#38b2ac' },
    { name: 'Snacks', icon: '🍿', color: '#ecc94b' },
    { name: 'Dairy', icon: '🥛', color: '#667eea' }
  ]

  const [products, setProducts] = useState([])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await apiFetch('/api/products')
        // Map backend product fields to front-end expected shape
        const mapped = data.map(p => ({
          id: p._id,
          name: p.name,
          category: p.category,
          image: p.image || '🛍️',
          price: p.price,
          weight: p.weight,
          quantity: p.quantity,
          description: p.description,
          inStock: p.inStock !== undefined ? p.inStock : true
        }))
        setProducts(mapped)
      } catch (err) {
        console.error('Failed to fetch products', err)
      }
    }
    loadProducts()
  }, [])

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const getQuantity = (productId) => {
    return quantities[productId] || 1
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return
    setQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }))
  }

  const handleAddToCart = (product) => {
    const quantity = getQuantity(product.id)
    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
    // Reset quantity to 1 after adding
    setQuantities(prev => ({
      ...prev,
      [product.id]: 1
    }))
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="hamburger">☰</span>
          </button>
          <h1 className="dashboard-logo">🥬 Better Bite</h1>
        </div>
        
        <div className="header-right">
          <Link to="/cart" className="cart-icon-link">
            <div className="cart-icon-wrapper">
              <span className="cart-icon">🛒</span>
              {getCartCount() > 0 && (
                <span className="cart-badge">{getCartCount()}</span>
              )}
            </div>
          </Link>
          
          <div className="profile-container">
            <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
              <span className="profile-icon">👤</span>
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <p className="profile-name">{user?.name || 'John Doe'}</p>
                  <p className="profile-email">{user?.email || 'john@example.com'}</p>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item">
                  <span>👤</span> My Profile
                </Link>
                <Link to="/orders" className="dropdown-item">
                  <span>📦</span> My Orders
                </Link>
                <Link to="/wishlist" className="dropdown-item">
                  <span>❤️</span> Wishlist
                </Link>
                <Link to="/settings" className="dropdown-item">
                  <span>⚙️</span> Settings
                </Link>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout-btn">
                  <span>🚪</span> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Side Navigation Menu */}
      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <div className="side-menu-header">
          <h3>Menu</h3>
          <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
        </div>
        <nav className="side-menu-nav">
          <Link to="/dashboard" className="menu-item active">
            <span>🏠</span> Home
          </Link>
          <Link to="/shop" className="menu-item">
            <span>🛍️</span> Shop
          </Link>
          <Link to="/cart" className="menu-item">
            <span>🛒</span> Cart
          </Link>
          <Link to="/orders" className="menu-item">
            <span>📦</span> Orders
          </Link>
          <Link to="/offers" className="menu-item">
            <span>🎁</span> Offers
          </Link>
          <Link to="/contact" className="menu-item">
            <span>📞</span> Contact
          </Link>
        </nav>
      </div>

      {/* Overlay */}
      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)}></div>}

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Categories Section */}
        <section className="categories-section">
          <h2 className="section-heading">Shop by Category</h2>
          <div className="categories-scroll">
            {categories.map((cat, index) => (
              <button
                key={index}
                className={`category-chip ${selectedCategory === cat.name ? 'active' : ''}`}
                style={{ borderColor: cat.color }}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <span className="category-chip-icon">{cat.icon}</span>
                <span className="category-chip-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recommended Products Section */}
        <section className="products-section">
          <h2 className="section-heading">
            {selectedCategory === 'All' ? 'Recommended Products' : `${selectedCategory} Products`}
          </h2>
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <span className="product-emoji">{product.image}</span>
                </div>
                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>
                  <div className={`stock-badge ${product.inStock ? 'in-stock' : 'out-of-stock'}`}
                    style={{ marginBottom: '8px' }}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </div>
                  <p className="product-description">{product.description}</p>
                  <div className="product-meta">
                    <span className="product-weight">📦 {product.weight}</span>
                    <span className="product-quantity">🔢 {product.quantity}</span>
                  </div>
                  <div className="product-quantity-selector">
                    <label>Quantity:</label>
                    <div className="quantity-control-inline">
                      <button
                        className="qty-btn-inline"
                        onClick={() => updateQuantity(product.id, getQuantity(product.id) - 1)}
                        disabled={!product.inStock}
                      >
                        −
                      </button>
                      <span className="qty-display-inline">{getQuantity(product.id)}</span>
                      <button
                        className="qty-btn-inline"
                        onClick={() => updateQuantity(product.id, getQuantity(product.id) + 1)}
                        disabled={!product.inStock}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="product-footer">
                    <span className="product-price">₹{(product.price * getQuantity(product.id)).toFixed(2)}</span>
                    <button 
                      className={`add-to-cart-btn ${!product.inStock ? 'disabled' : ''}`}
                      onClick={() => product.inStock && handleAddToCart(product)}
                      disabled={!product.inStock}
                    >
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Add to Cart Notification */}
      {showNotification && notificationProduct && (
        <div className="cart-notification">
          <div className="notification-content">
            <span className="notification-icon">✅</span>
            <div className="notification-text">
              <strong>{notificationProduct.name}</strong> added to cart!
            </div>
            <button 
              className="view-cart-btn"
              onClick={() => navigate('/cart')}
            >
              View Cart
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
