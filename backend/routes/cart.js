const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Cart = require('../models/Cart')

// GET /api/cart/:userId - get user's cart
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params
    if (req.user._id.toString() !== userId.toString()) return res.status(403).json({ error: 'Forbidden' })

    let cart = await Cart.findOne({ userId })
    if (!cart) {
      cart = new Cart({ userId, items: [] })
      await cart.save()
    }
    res.json(cart)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/cart/:userId - set user's cart (replace)
router.post('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params
    if (req.user._id.toString() !== userId.toString()) return res.status(403).json({ error: 'Forbidden' })

    const { items } = req.body
    let cart = await Cart.findOne({ userId })
    if (!cart) {
      cart = new Cart({ userId, items })
    } else {
      cart.items = items
    }
    await cart.save()
    res.json(cart)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/cart/:userId - clear cart
router.delete('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params
    if (req.user._id.toString() !== userId.toString()) return res.status(403).json({ error: 'Forbidden' })

    await Cart.findOneAndDelete({ userId })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
