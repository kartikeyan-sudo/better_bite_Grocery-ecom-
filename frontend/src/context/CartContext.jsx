import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import apiFetch from '../utils/api'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [showNotification, setShowNotification] = useState(false)
  const [notificationProduct, setNotificationProduct] = useState(null)

  const { isAuthenticated, user, token } = useAuth()

  // Load cart from backend if authenticated, otherwise localStorage
  useEffect(() => {
    const load = async () => {
      if (isAuthenticated && user) {
        try {
          const userId = user.id || user._id
          if (!userId) throw new Error('Missing user id for cart fetch')
          const data = await apiFetch(`/api/cart/${userId}`)
          // backend Cart model uses items array with productId, name, price, quantity, image
          const mapped = data.items.map(i => ({
            id: i.productId || i._id || i.product || i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image
          }))
          setCart(mapped)
        } catch (err) {
          console.error('Failed to load cart from server', err)
          // fallback to localStorage
          const savedCart = localStorage.getItem('cart')
          if (savedCart) setCart(JSON.parse(savedCart))
        }
      } else {
        const savedCart = localStorage.getItem('cart')
        if (savedCart) setCart(JSON.parse(savedCart))
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, token])

  // Save cart to backend when authenticated, otherwise localStorage
  useEffect(() => {
    const persist = async () => {
      if (isAuthenticated && user) {
        try {
          const items = cart.map(i => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image }))
          const userId = user.id || user._id
          if (!userId) return
          await apiFetch(`/api/cart/${userId}`, { method: 'POST', body: { items } })
        } catch (err) {
          console.error('Failed to sync cart to server', err)
        }
      } else {
        localStorage.setItem('cart', JSON.stringify(cart))
      }
    }
    persist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, isAuthenticated, user])

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })

    // Show notification
    setNotificationProduct(product)
    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        showNotification,
        notificationProduct
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
