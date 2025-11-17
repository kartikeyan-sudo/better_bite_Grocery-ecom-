const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Order = require('../models/Order')
const Product = require('../models/Product')
const { sendOrderNotification } = require('../services/telegramBot')

// POST /api/orders - create order (requires auth)
router.post('/', auth, async (req, res) => {
  try {
    const { items, total, shippingAddress } = req.body
    if (!items || !items.length) return res.status(400).json({ error: 'No items' })
    if (!shippingAddress) return res.status(400).json({ error: 'Shipping address is required' })

    // Validate stock availability for all items
    const ids = items
      .map(i => i.productId)
      .filter(Boolean)
    if (ids.length) {
      const products = await Product.find({ _id: { $in: ids } }).select('name inStock')
      const outOfStock = new Map(products.filter(p => !p.inStock).map(p => [p._id.toString(), p.name]))
      const offending = items.find(i => outOfStock.has((i.productId || '').toString()))
      if (offending) {
        return res.status(400).json({ error: `Product out of stock: ${outOfStock.get(offending.productId.toString())}` })
      }
    }

    const order = new Order({
      userId: req.user._id,
      items,
      total,
      shippingAddress,
      status: 'Pending',
      orderDate: new Date(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    })

    await order.save()
    
    // Populate userId for Telegram notification
    await order.populate('userId', 'name email')
    
    // Send Telegram notification
    await sendOrderNotification(order)
    
    res.status(201).json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/orders/user/:userId - get orders for a user (auth required)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params
    // allow users to get only their own orders (or admin later)
    if (req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    const orders = await Order.find({ userId }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/orders/:id - get single order (auth)
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found' })
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    res.json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
