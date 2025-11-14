const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Admin authentication middleware
module.exports = async function(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret')
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user) return res.status(401).json({ error: 'Invalid token' })
    if (!user.isAdmin) return res.status(403).json({ error: 'Access denied. Admin only.' })

    req.user = user
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}
