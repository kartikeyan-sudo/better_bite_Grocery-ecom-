const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    console.log('Auth register payload:', req.body)
    if (!name || !email || !password) {
      console.warn('Register validation failed - missing fields:', { name, email, password })
      return res.status(400).json({ error: 'Missing fields' })
    }

    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ error: 'Email already registered' })

    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(password, salt)

    const user = new User({ name, email, password: hashed })
    await user.save()

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' })

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    console.log('Auth login payload:', req.body)
    if (!email || !password) {
      console.warn('Login validation failed - missing fields:', { email, password })
      return res.status(400).json({ error: 'Missing fields' })
    }

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ error: 'Invalid credentials' })

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked. Contact support.' })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' })

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, isBlocked: user.isBlocked } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
