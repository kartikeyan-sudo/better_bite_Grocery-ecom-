const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const User = require('../models/User')

// GET /api/users/me
router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/users/me
router.put('/me', auth, async (req, res) => {
  try {
    const updates = {}
    if (req.body.name) updates.name = req.body.name
    if (req.body.phone) updates.phone = req.body.phone
    if (req.body.avatar) updates.avatar = req.body.avatar

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
