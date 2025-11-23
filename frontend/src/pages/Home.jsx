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
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [products, setProducts] = useState([])
  const [contactPhone, setContactPhone] = useState(null)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Send a wake-up request to the backend
      await apiFetch('/api/products?limit=1')
      // Reload products
      const data = await apiFetch('/api/products')
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
      console.error('Failed to refresh', err)
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiFetch('/api/categories')
        const allCategory = { 
          name: 'All', 
          icon: '🛒', 
          bannerImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23667eea;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23764ba2;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23grad)" /%3E%3Ctext x="50" y="65" font-size="50" text-anchor="middle" fill="white"%3E🛒%3C/text%3E%3C/svg%3E', 
          _id: 'all' 
        }
        setCategories([allCategory, ...data])
      } catch (err) {
        console.error('Failed to fetch categories', err)
        // Fallback to default categories
        setCategories([{ 
          name: 'All', 
          icon: '🛒', 
          bannerImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23667eea;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23764ba2;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="100" height="100" fill="url(%23grad)" /%3E%3Ctext x="50" y="65" font-size="50" text-anchor="middle" fill="white"%3E🛒%3C/text%3E%3C/svg%3E', 
          _id: 'all' 
        }])
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

  // Fetch contact info (from admin CMS) to get WhatsApp number
  useEffect(() => {
    const loadContact = async () => {
      try {
        const data = await apiFetch('/api/contact')
        if (data && data.whatsapp) setContactPhone(data.whatsapp)
      } catch (err) {
        console.error('Failed to load contact info', err)
      }
    }
    loadContact()
  }, [])

  const filteredProducts = products
    .filter(p => {
      // When searching, show all categories
      if (searchQuery.trim()) return true
      // Otherwise filter by selected category
      return selectedCategory === 'All' || p.category === selectedCategory
    })
    .filter(p => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase().trim()
      
      // Search through all relevant fields
      const searchableText = [
        p.name,
        p.description,
        p.category,
        p.weight,
        p.price?.toString(),
        p.mrp?.toString(),
        p.inStock ? 'in stock' : 'out of stock',
        p.recommended ? 'recommended' : '',
      ].filter(Boolean).join(' ').toLowerCase()
      
      return searchableText.includes(query)
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
        <div className="product-weight-info">{product.weight} • {product.quantity}</div>
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
                    onClick={() => navigate('/login')}
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
          <div className="logo-container">
            <span className="logo-text">Better Bites</span>
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh products & wake backend"
          >
            <svg className="refresh-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>

          <Link to="/login" className="auth-btn login-btn">Login</Link>
          <Link to="/register" className="auth-btn signup-btn">Sign Up</Link>
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
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
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
                  <>
                    <div className="category-chip-banner">
                      <img src={cat.bannerImage} alt={cat.name} className="category-chip-img" />
                      <div className="category-chip-overlay">
                        <span className="category-chip-icon">{cat.icon}</span>
                      </div>
                    </div>
                    <span className="category-chip-name">{cat.name}</span>
                  </>
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
            {searchQuery ? `Search Results (${filteredProducts.filter(p => p.inStock).length})` : 
             selectedCategory === 'All' ? 'All Products' : `${selectedCategory} Products`}
          </h2>
          {searchQuery ? (
            // Show all search results together
            filteredProducts.filter(p => p.inStock).length === 0 ? (
              <div className="empty-results">
                <div className="empty-illustration">🔍</div>
                <h3 className="empty-title">No results found</h3>
                <p className="empty-message">
                  We couldn't find any products matching "{searchQuery}"
                </p>
                <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.filter(p => p.inStock).map(product => renderProductCard(product))}
              </div>
            )
          ) : (
            // Show regular category filtered products
            inStockProducts.length === 0 && recommendedProducts.length === 0 ? (
              <div className="empty-results">
                <div className="empty-illustration">🔍</div>
                <h3 className="empty-title">No products available</h3>
                <p className="empty-message">All products are currently out of stock</p>
              </div>
            ) : (
              <div className="products-grid">
                {inStockProducts.map(product => renderProductCard(product))}
              </div>
            )
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

      {/* WhatsApp floating button: opens admin-configured WhatsApp number */}
      {contactPhone && (
        <a
          className="whatsapp-float"
          href={`https://wa.me/${String(contactPhone).replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat with us on WhatsApp"
        >
          <svg className="whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16.5 7.5a3.5 3.5 0 0 0-5-0.39L9 9l-1 1 1 1 1 1 .89.89A3.5 3.5 0 1 0 16.5 7.5z"></path>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <span className="whatsapp-green-label">Contact WhatsApp</span>
        </a>
      )}
    </div>
  )
}
