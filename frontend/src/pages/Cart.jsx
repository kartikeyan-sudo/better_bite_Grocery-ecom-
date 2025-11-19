import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import apiFetch from '../utils/api'
import '../styles/Cart.css'

export default function Cart() {
  const navigate = useNavigate()
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [quickAddQuantities, setQuickAddQuantities] = useState({})
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressData, setAddressData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!')
      return
    }

    if (!user) {
      alert('Please login to checkout')
      navigate('/login')
      return
    }

    // Show address form instead of immediate checkout
    setShowAddressForm(true)
  }

  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setAddressData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    
    // Validate address
    if (!addressData.fullName || !addressData.phone || !addressData.address || 
        !addressData.city || !addressData.state || !addressData.pincode) {
      alert('Please fill in all address fields')
      return
    }
    
    setLoading(true)
    try {
      // Calculate final total
      const subtotal = getCartTotal()
      const deliveryFee = subtotal > 500 ? 0 : 40
      const tax = subtotal * 0.05
      const finalTotal = subtotal + deliveryFee + tax
      
      // Create order on backend
      const items = cart.map(item => ({
        productId: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity
      }))

      await apiFetch('/api/orders', {
        method: 'POST',
        body: { 
          items, 
          total: finalTotal,
          shippingAddress: addressData
        }
      })
      
      // Clear cart and address
      clearCart()
      setAddressData({
        fullName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
      })
      setShowAddressForm(false)
      
      // Navigate to orders page
      alert('Order placed successfully!')
      navigate('/orders')
    } catch (err) {
      console.error('Checkout failed', err)
      alert(err.message || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart()
    }
  }

  const getQuickAddQuantity = (itemId) => {
    return quickAddQuantities[itemId] || 1
  }

  const updateQuickAddQuantity = (itemId, value) => {
    const num = parseInt(value) || 1
    setQuickAddQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, num)
    }))
  }

  const handleQuickAdd = (item) => {
    const addQty = getQuickAddQuantity(item.id)
    updateQuantity(item.id, item.quantity + addQty)
    // Reset to 1 after adding
    setQuickAddQuantities(prev => ({
      ...prev,
      [item.id]: 1
    }))
  }

  // Memoize calculations to ensure proper updates
  const subtotal = useMemo(() => getCartTotal(), [cart])
  const deliveryFee = useMemo(() => subtotal > 500 ? 0 : 40, [subtotal])
  const tax = useMemo(() => subtotal * 0.05, [subtotal])
  const finalTotal = useMemo(() => subtotal + deliveryFee + tax, [subtotal, deliveryFee, tax])

  return (
    <div className="cart-page">
      {/* Header */}
      <header className="cart-header">
        <div className="cart-header-content">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1>Shopping Cart</h1>
          <button className="refresh-btn" onClick={() => window.location.reload()}>
            🔄
          </button>
        </div>
      </header>

      {/* Cart Content */}
      <div className="cart-container">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some products to get started!</p>
            <button className="continue-shopping-btn" onClick={() => navigate('/dashboard')}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="cart-content">
            {/* Cart Items */}
            <div className="cart-items-section">
              <div className="cart-items-header">
                <h2>Cart Items ({cart.length})</h2>
                <button className="clear-cart-btn" onClick={handleClearCart}>
                  🗑️ Clear Cart
                </button>
              </div>

              <div className="cart-items-list">
                {cart.map((item) => {
                  const itemTotal = (item.price * item.quantity).toFixed(2);
                  
                  return (
                  <div key={`${item.id}-${item.quantity}`} className="cart-item">
                    <div className="cart-item-image">
                      {String(item.image).startsWith('http') ? (
                        <img src={item.image} alt={item.name} className="cart-item-img" />
                      ) : (
                        <span className="cart-item-emoji">{item.image}</span>
                      )}
                    </div>
                    
                    <div className="cart-item-details">
                      <h3 className="cart-item-name">{item.name}</h3>
                      <p className="cart-item-description">{item.description}</p>
                      <div className="cart-item-meta">
                        <span>📦 {item.weight}</span>
                        <span>🔢 {item.quantity}</span>
                      </div>
                    </div>

                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <div className="quick-add-section">
                        <div className="quick-add-controls">
                          <input
                            type="number"
                            min="1"
                            value={getQuickAddQuantity(item.id)}
                            onChange={(e) => updateQuickAddQuantity(item.id, e.target.value)}
                            className="quick-add-input"
                            placeholder="Qty"
                          />
                          <button
                            className="quick-add-btn"
                            onClick={() => handleQuickAdd(item)}
                            title={`Add ${getQuickAddQuantity(item.id)} more`}
                          >
                            + Add More
                          </button>
                        </div>
                      </div>

                      <div className="cart-item-price">
                        <span className="item-total">₹{itemTotal}</span>
                        <span className="item-unit-price">₹{item.price.toFixed(2)} each</span>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            </div>

            {/* Cart Summary */}
            <div className="cart-summary-section">
              <div className="cart-summary">
                <h2>Order Summary</h2>
                
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '600' }}>Decision Pending</span>
                </div>

                <div className="summary-row">
                  <span>Tax (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row total-row">
                  <span>Total</span>
                  <span className="total-amount">
                    ₹{finalTotal.toFixed(2)}
                  </span>
                </div>

                <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
                  {loading ? 'Processing...' : 'Proceed to Checkout'}
                </button>

                <div className="delivery-note">
                  <p className="delivery-info" style={{ color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                    💡 Delivery charges will be updated by admin after order confirmation
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="address-modal-overlay" onClick={() => setShowAddressForm(false)}>
          <div className="address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h2>Delivery Address</h2>
            </div>
            <form onSubmit={handlePlaceOrder} className="address-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={addressData.fullName}
                    onChange={handleAddressChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={addressData.phone}
                    onChange={handleAddressChange}
                    required
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{gridColumn: '1 / -1'}}>
                  <label>Address *</label>
                  <textarea
                    name="address"
                    value={addressData.address}
                    onChange={handleAddressChange}
                    required
                    placeholder="House/Flat no., Street, Area"
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={addressData.city}
                    onChange={handleAddressChange}
                    required
                    placeholder="City"
                  />
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={addressData.state}
                    onChange={handleAddressChange}
                    required
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={addressData.pincode}
                    onChange={handleAddressChange}
                    required
                    pattern="[0-9]{6}"
                    placeholder="6-digit pincode"
                  />
                </div>
              </div>

              <div className="order-summary-mini">
                <h3>Order Summary</h3>
                <div className="summary-line">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span>Delivery:</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="summary-line">
                  <span>Tax (5%):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="summary-line total-line">
                  <span>Total:</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="address-form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddressForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="place-order-btn"
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
