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
        <div className="product-weight-info"> {product.weight} • {product.quantity}</div>
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

          <Link to="/cart" className="cart-icon-link">
            <div className="cart-icon-wrapper">
              <svg className="cart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {getCartCount() > 0 && (
                <span className="cart-badge">{getCartCount()}</span>
              )}
            </div>
          </Link>
          
          <div className="profile-container">
            <button className="profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
              <svg className="profile-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <p className="profile-name">{user?.name || 'John Doe'}</p>
                  <p className="profile-email">{user?.email || 'john@example.com'}</p>
                </div>
                <div className="dropdown-divider"></div>
                <Link to="/profile" className="dropdown-item">
                  <svg className="dropdown-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  My Profile
                </Link>
                <Link to="/orders" className="dropdown-item">
                  <svg className="dropdown-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="3" x2="9" y2="21"></line>
                  </svg>
                  My Orders
                </Link>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout-btn">
                  <svg className="dropdown-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
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

      {/* WhatsApp floating button */}
      {contactPhone && (
        <a
          className="whatsapp-float"
          href={`https://wa.me/${String(contactPhone).replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat with us on WhatsApp"
        >
          <svg className="whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="whatsapp-green-label">Contact WhatsApp</span>
        </a>
      )}
    </div>
  )
}
