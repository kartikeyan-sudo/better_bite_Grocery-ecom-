import React, { useState } from 'react'
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
        body: { items, total: finalTotal }
      })
      
      // Clear cart
      clearCart()
      
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

  return (
    <div className="cart-page">
      {/* Header */}
      <header className="cart-header">
        <div className="cart-header-content">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Shopping
          </button>
          <h1>Shopping Cart</h1>
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
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      <span className="cart-item-emoji">{item.image}</span>
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

                      <div className="cart-item-price">
                        <span className="item-total">₹{(item.price * item.quantity).toFixed(2)}</span>
                        <span className="item-unit-price">₹{item.price} each</span>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Summary */}
            <div className="cart-summary-section">
              <div className="cart-summary">
                <h2>Order Summary</h2>
                
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{getCartTotal().toFixed(2)}</span>
                </div>

                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>{getCartTotal() > 500 ? 'FREE' : '₹40.00'}</span>
                </div>

                <div className="summary-row">
                  <span>Tax (5%)</span>
                  <span>₹{(getCartTotal() * 0.05).toFixed(2)}</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row total-row">
                  <span>Total</span>
                  <span className="total-amount">
                    ₹{(getCartTotal() * 1.05 + (getCartTotal() > 500 ? 0 : 40)).toFixed(2)}
                  </span>
                </div>

                <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
                  {loading ? 'Processing...' : 'Proceed to Checkout'}
                </button>

                <div className="delivery-note">
                  {getCartTotal() > 500 ? (
                    <p className="free-delivery">🎉 You got FREE delivery!</p>
                  ) : (
                    <p className="delivery-info">
                      Add ₹{(500 - getCartTotal()).toFixed(2)} more for FREE delivery
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
