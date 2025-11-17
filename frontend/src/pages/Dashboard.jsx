import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import apiFetch from '../utils/api'
import '../styles/Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { addToCart, getCartCount, showNotification, notificationProduct, cart } = useCart()
  const { logout, user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [quantities, setQuantities] = useState({})
  const [categories, setCategories] = useState([])

  const [products, setProducts] = useState([])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiFetch('/api/categories')
        const allCategory = { name: 'All', icon: '🛒', bannerImage: '', _id: 'all' }
        setCategories([allCategory, ...data])
      } catch (err) {
        console.error('Failed to fetch categories', err)
        // Fallback to default categories
        setCategories([{ name: 'All', icon: '🛒', bannerImage: '', _id: 'all' }])
      }
    }
    loadCategories()
  }, [])

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
          mrp: p.mrp,
          weight: p.weight,
          quantity: p.quantity,
          description: p.description,
          inStock: p.inStock !== undefined ? p.inStock : true,
          recommended: p.recommended || false,
          purchaseLimit: p.purchaseLimit || null
        }))
        setProducts(mapped)
      } catch (err) {
        console.error('Failed to fetch products', err)
      }
    }
    loadProducts()
  }, [])

  const filteredProducts = products
    .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
    .filter(p => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(query) || 
             (p.description && p.description.toLowerCase().includes(query)) ||
             p.category.toLowerCase().includes(query)
    })

  // Separate products into sections
  const recommendedProducts = filteredProducts.filter(p => p.recommended && p.inStock)
  const inStockProducts = filteredProducts.filter(p => !p.recommended && p.inStock)
  const outOfStockProducts = filteredProducts.filter(p => !p.inStock)

  const getQuantity = (productId) => {
    return quantities[productId] || 1
  }

  const getCartQuantity = (productId) => {
    const item = cart.find(item => item.id === productId)
    return item ? item.quantity : 0
  }

  const getMaxAllowed = (product) => {
    if (!product.purchaseLimit) return Infinity
    const inCart = getCartQuantity(product.id)
    return Math.max(0, product.purchaseLimit - inCart)
  }

  const updateQuantity = (productId, newQuantity, product) => {
    if (newQuantity < 1) return
    const maxAllowed = getMaxAllowed(product)
    if (newQuantity > maxAllowed) {
      alert(`Cannot add more than ${product.purchaseLimit} ${product.purchaseLimit === 1 ? 'item' : 'items'} per customer`)
      return
    }
    setQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }))
  }

  const handleAddToCart = (product) => {
    const quantity = getQuantity(product.id)
    const maxAllowed = getMaxAllowed(product)
    
    if (quantity > maxAllowed) {
      alert(`Cannot add ${quantity} items. Maximum ${product.purchaseLimit} ${product.purchaseLimit === 1 ? 'item' : 'items'} allowed per customer. You have ${getCartQuantity(product.id)} in cart.`)
      return
    }
    
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

  const renderProductCard = (product) => (
    <div key={product.id} className="product-card">
      <div className="product-image-wrapper">
        {String(product.image).startsWith('http') ? (
          <img src={product.image} alt={product.name} className="product-img" />
        ) : (
          <div className="product-emoji-wrapper">
            <span className="product-emoji">{product.image}</span>
          </div>
        )}
        {product.mrp && Number(product.mrp) > Number(product.price) && (
          <div className="discount-badge">
            {Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)}% OFF
          </div>
        )}
        {!product.inStock && <div className="out-of-stock-overlay">OUT OF STOCK</div>}
      </div>
      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-weight-info">📦 {product.weight} • {product.quantity}</div>
        {product.purchaseLimit && (
          <div className="purchase-limit-badge">
            🔒 Max {product.purchaseLimit} per customer
            {getCartQuantity(product.id) > 0 && (
              <span className="in-cart-info"> • {getCartQuantity(product.id)} in cart</span>
            )}
          </div>
        )}
        <div className="product-bottom">
          <div className="price-section">
            {product.mrp && Number(product.mrp) > Number(product.price) ? (
              <>
                <div className="price-wrapper">
                  <span className="mrp-label">MRP</span>
                  <span className="mrp-price">₹{(product.mrp * getQuantity(product.id)).toFixed(2)}</span>
                </div>
                <div className="offer-price-wrapper">
                  <span className="offer-price">₹{(product.price * getQuantity(product.id)).toFixed(2)}</span>
                  {getQuantity(product.id) > 1 && (
                    <span className="save-text">₹{product.price}/each</span>
                  )}
                </div>
              </>
            ) : (
              <span className="offer-price-solo">₹{(product.price * getQuantity(product.id)).toFixed(2)}</span>
            )}
          </div>
          {product.inStock ? (
            <div className="add-section">
              {getMaxAllowed(product) === 0 ? (
                <div className="limit-reached-badge">Limit Reached</div>
              ) : (
                <>
                  <div className="quantity-selector">
                    <label>Qty:</label>
                    <button
                      className="qty-selector-btn"
                      onClick={() => updateQuantity(product.id, Math.max(1, getQuantity(product.id) - 1), product)}
                      disabled={getQuantity(product.id) <= 1}
                    >
                      −
                    </button>
                    <select
                      value={getQuantity(product.id)}
                      onChange={(e) => updateQuantity(product.id, parseInt(e.target.value), product)}
                    >
                      {[...Array(Math.min(10, getMaxAllowed(product)))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                    <button
                      className="qty-selector-btn"
                      onClick={() => updateQuantity(product.id, Math.min(getMaxAllowed(product), getQuantity(product.id) + 1), product)}
                      disabled={getQuantity(product.id) >= getMaxAllowed(product)}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    className="add-btn"
                    onClick={() => handleAddToCart(product)}
                  >
                    ADD TO CART
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="unavailable-text">Unavailable</div>
          )}
        </div>
      </div>
    </div>
  )

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
          <Link to="/cart" className="menu-item">
            <span>🛒</span> Cart
          </Link>
          <Link to="/orders" className="menu-item">
            <span>📦</span> Orders
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
        {/* Search Bar */}
        <section className="search-section">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search for products, groceries, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
        </section>

        {/* Categories Section */}
        <section className="categories-section">
          <h2 className="section-heading">Shop by Category</h2>
          <div className="categories-scroll">
            {categories.map((cat) => (
              <button
                key={cat._id || cat.name}
                className={`category-chip ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.bannerImage ? (
                  <div className="category-chip-banner">
                    <img src={cat.bannerImage} alt={cat.name} className="category-chip-img" />
                    <div className="category-chip-overlay">
                      <span className="category-chip-icon">{cat.icon}</span>
                      <span className="category-chip-name">{cat.name}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="category-chip-icon">{cat.icon}</span>
                    <span className="category-chip-name">{cat.name}</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Recommended Products Section */}
        {!searchQuery && recommendedProducts.length > 0 && (
          <section className="products-section recommended-section">
            <h2 className="section-heading">⭐ Recommended for You</h2>
            <div className="products-grid">
              {recommendedProducts.map(product => renderProductCard(product))}
            </div>
          </section>
        )}

        {/* All Products Section */}
        <section className="products-section">
          <h2 className="section-heading">
            {searchQuery ? `Search Results (${inStockProducts.length + recommendedProducts.length})` : 
             selectedCategory === 'All' ? 'All Products' : `${selectedCategory} Products`}
          </h2>
          {inStockProducts.length === 0 && (!searchQuery && recommendedProducts.length === 0) ? (
            <div className="empty-results">
              <div className="empty-illustration">🔍</div>
              <h3 className="empty-title">
                {searchQuery ? 'No results found' : 'No products available'}
              </h3>
              <p className="empty-message">
                {searchQuery 
                  ? `We couldn't find any products matching "${searchQuery}"` 
                  : 'All products are currently out of stock'}
              </p>
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="products-grid">
              {inStockProducts.map(product => renderProductCard(product))}
            </div>
          )}
        </section>

        {/* Out of Stock Section */}
        {!searchQuery && outOfStockProducts.length > 0 && (
          <section className="products-section out-of-stock-section">
            <h2 className="section-heading">📦 Currently Out of Stock</h2>
            <div className="products-grid">
              {outOfStockProducts.map(product => renderProductCard(product))}
            </div>
          </section>
        )}
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
