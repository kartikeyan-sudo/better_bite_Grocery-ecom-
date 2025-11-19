const express = require('express')
const router = express.Router()
const adminAuth = require('../middleware/adminAuth')
const User = require('../models/User')
const Product = require('../models/Product')
const Order = require('../models/Order')
const Category = require('../models/Category')
const { sendStatusUpdate } = require('../services/telegramBot')

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
    const { name, category, image, price, mrp, weight, quantity, description, inStock, recommended, purchaseLimit } = req.body
    
    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (mrp && Number(mrp) < Number(price)) {
      return res.status(400).json({ error: 'MRP must be greater than or equal to price' })
    }

    if (purchaseLimit && Number(purchaseLimit) < 1) {
      return res.status(400).json({ error: 'Purchase limit must be at least 1' })
    }

    const product = new Product({
      name,
      category,
      image: image || '',
      price,
      mrp,
      weight: weight || '',
      quantity: quantity || '',
      description: description || '',
      inStock: inStock !== undefined ? inStock : true,
      recommended: recommended || false,
      purchaseLimit: purchaseLimit || null
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
    const { name, category, image, price, mrp, weight, quantity, description, inStock, recommended, purchaseLimit } = req.body

    if (mrp && Number(mrp) < Number(price)) {
      return res.status(400).json({ error: 'MRP must be greater than or equal to price' })
    }

    if (purchaseLimit && Number(purchaseLimit) < 1) {
      return res.status(400).json({ error: 'Purchase limit must be at least 1' })
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, image, price, mrp, weight, quantity, description, inStock, recommended, purchaseLimit: purchaseLimit || null },
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

    // Get old order to track status change
    const oldOrder = await Order.findById(req.params.id)
    if (!oldOrder) return res.status(404).json({ error: 'Order not found' })
    
    const oldStatus = oldOrder.status

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name email')

    if (!order) return res.status(404).json({ error: 'Order not found' })
    
    // Send Telegram notification about status change
    if (oldStatus !== status) {
      await sendStatusUpdate(order, oldStatus)
    }
    
    res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/admin/orders/:id/delivery - Update estimated delivery
router.put('/orders/:id/delivery', adminAuth, async (req, res) => {
  try {
    const { estimatedDelivery } = req.body
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { estimatedDelivery },
      { new: true }
    ).populate('userId', 'name email')

    if (!order) return res.status(404).json({ error: 'Order not found' })
    
    res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ===== CATEGORY ROUTES =====

// GET /api/admin/categories - Get all categories
router.get('/categories', adminAuth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ displayOrder: 1, name: 1 })
    res.json(categories)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/admin/categories - Create category
router.post('/categories', adminAuth, async (req, res) => {
  try {
    const { name, icon, bannerImage, displayOrder, isActive } = req.body
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' })
    }

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' })
    }

    const category = new Category({
      name,
      icon: icon || '📦',
      bannerImage: bannerImage || '',
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true
    })

    await category.save()
    res.status(201).json(category)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/admin/categories/:id - Update category
router.put('/categories/:id', adminAuth, async (req, res) => {
  try {
    const { name, icon, bannerImage, displayOrder, isActive } = req.body
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, icon, bannerImage, displayOrder, isActive },
      { new: true, runValidators: true }
    )

    if (!category) return res.status(404).json({ error: 'Category not found' })
    res.json(category)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/admin/categories/:id - Delete category
router.delete('/categories/:id', adminAuth, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ error: 'Category not found' })
    res.json({ success: true, message: 'Category deleted' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ==================== CONTACT INFO ROUTES ====================

// GET /api/admin/contact - Get contact info
router.get('/contact', adminAuth, async (req, res) => {
  try {
    const Contact = require('../models/Contact')
    let contact = await Contact.findOne()
    
    if (!contact) {
      // Return empty structure if no contact exists
      contact = {}
    }
    
    res.json(contact)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/admin/contact - Update contact info (creates if doesn't exist)
router.put('/contact', adminAuth, async (req, res) => {
  try {
    const Contact = require('../models/Contact')
    const {
      businessName, email, phone, alternatePhone, whatsapp,
      address, city, state, pincode, country,
      mondayToFriday, saturday, sunday,
      facebook, instagram, twitter,
      googleMapUrl, description
    } = req.body
    
    // Validation
    if (!businessName || !email || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Required fields: businessName, email, phone, address, city, state, pincode' })
    }
    
    let contact = await Contact.findOne()
    
    if (contact) {
      // Update existing
      Object.assign(contact, {
        businessName, email, phone, alternatePhone, whatsapp,
        address, city, state, pincode, country,
        mondayToFriday, saturday, sunday,
        facebook, instagram, twitter,
        googleMapUrl, description
      })
      await contact.save()
    } else {
      // Create new
      contact = await Contact.create({
        businessName, email, phone, alternatePhone, whatsapp,
        address, city, state, pincode, country,
        mondayToFriday, saturday, sunday,
        facebook, instagram, twitter,
        googleMapUrl, description
      })
    }
    
    res.json(contact)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
