const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const User = require('../models/User')
const Product = require('../models/Product')
const Order = require('../models/Order')

// GET /api/admin/stats - Dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ isAdmin: false })
    const totalProducts = await Product.countDocuments()
    const totalOrders = await Order.countDocuments()
    const pendingOrders = await Order.countDocuments({ status: 'Pending' })
    
    res.json({
      totalCustomers,
      totalProducts,
      totalOrders,
      pendingOrders
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/admin/customers - Get all customers
router.get('/customers', adminAuth, async (req, res) => {
  try {
    const customers = await User.find({ isAdmin: false }).select('-password').sort({ createdAt: -1 })
    res.json(customers)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/admin/customers/:id/block - Block/Unblock a customer
router.put('/customers/:id/block', adminAuth, async (req, res) => {
  try {
    const { blocked } = req.body
    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ error: 'Missing or invalid "blocked" boolean' })
    }
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, isAdmin: false },
      { isBlocked: blocked },
      { new: true }
    ).select('-password')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/admin/products - Get all products
router.get('/products', adminAuth, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/admin/products - Create product
router.post('/products', adminAuth, async (req, res) => {
  try {
    const { name, category, image, price, weight, quantity, description, inStock } = req.body
    
    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const product = new Product({
      name,
      category,
      image: image || '',
      price,
      weight: weight || '',
      quantity: quantity || '',
      description: description || '',
      inStock: inStock !== undefined ? inStock : true
    })

    await product.save()
    res.status(201).json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', adminAuth, async (req, res) => {
  try {
    const { name, category, image, price, weight, quantity, description, inStock } = req.body
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, image, price, weight, quantity, description, inStock },
      { new: true, runValidators: true }
    )

    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ error: 'Product not found' })
    res.json({ success: true, message: 'Product deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/admin/orders - Get all orders
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'name email').sort({ orderDate: -1 })
    res.json(orders)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body
    
    if (!['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name email')

    if (!order) return res.status(404).json({ error: 'Order not found' })
    res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
