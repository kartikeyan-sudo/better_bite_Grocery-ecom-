const jwt = require('jsonwebtoken')
const User = require('../models/User')

module.exports = async function auth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token provided' })

  const parts = authHeader.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'Token error' })

  const [scheme, token] = parts
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'Token malformatted' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret')
    req.user = await User.findById(payload.id).select('-password')
    if (!req.user) return res.status(401).json({ error: 'Token invalid' })
    if (req.user.isBlocked) return res.status(403).json({ error: 'Account is blocked. Contact support.' })
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid' })
  }
}
