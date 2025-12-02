import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { CartProvider } from './context/CartContext'
import { OrderProvider } from './context/OrderContext'
import { startKeepalive } from './utils/keepalive'
import LoadingPopup from './components/LoadingPopup'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Contact from './pages/Contact'
import AdminLogin from './pages/AdminLogin'
import RequireAdmin from './components/RequireAdmin'
import AdminDashboard from './pages/AdminDashboard'
import AdminCustomers from './pages/AdminCustomers'
import AdminProducts from './pages/AdminProducts'
import AdminOrders from './pages/AdminOrders'
import AdminCategories from './pages/AdminCategories'
import AdminContact from './pages/AdminContact'

export default function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Start keepalive to prevent backend from sleeping
    startKeepalive()
  }, [])

  return (
    <>
      {isLoading && <LoadingPopup onComplete={() => setIsLoading(false)} />}
      
      <AuthProvider>
        <AdminAuthProvider>
          <OrderProvider>
            <CartProvider>
              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                <Route path="/admin/customers" element={<RequireAdmin><AdminCustomers /></RequireAdmin>} />
                <Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
                <Route path="/admin/categories" element={<RequireAdmin><AdminCategories /></RequireAdmin>} />
                <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
                <Route path="/admin/contact" element={<RequireAdmin><AdminContact /></RequireAdmin>} />
              </Routes>
              </Router>
            </CartProvider>
          </OrderProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </>
  )
}
