require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')
const productsRouter = require('./routes/products')
const ordersRouter = require('./routes/orders')
const cartRouter = require('./routes/cart')
const adminRouter = require('./routes/admin')

const app = express()

// Configure CORS to allow requests from the frontend when hosted separately.
// Set `CORS_ORIGIN` in `backend/.env` to a comma-separated list of allowed origins,
// e.g. `CORS_ORIGIN=http://localhost:5173,https://www.yourfrontend.com`.
const allowedOriginsEnv = process.env.CORS_ORIGIN || ''
const allowedOrigins = allowedOriginsEnv.split(',').map(s => s.trim()).filter(Boolean)

console.log('CORS allowed origins:', allowedOrigins.length ? allowedOrigins : '[none - permissive]')

if (allowedOrigins.length === 0) {
  // No origins specified: allow all (useful for quick dev), but consider setting CORS_ORIGIN in production
  app.use(cors())
} else {
  app.use(cors({
    origin: function (origin, callback) {
      // allow requests with no origin (e.g., mobile apps, curl)
      if (!origin) return callback(null, true)
      if (allowedOrigins.indexOf(origin) !== -1) {
        console.log('CORS allow:', origin)
        return callback(null, true)
      }
      console.warn('CORS reject:', origin)
      return callback(new Error('CORS policy: This origin is not allowed'))
    }
  }))
}

app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/cart', cartRouter)
app.use('/api/admin', adminRouter)

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecomm'

// Attempt initial MongoDB connection
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB')
    // optional: seed some products if none exist
    const Product = require('./models/Product')
    const User = require('./models/User')
    const count = await Product.countDocuments()
    if (count === 0) {
      console.log('Seeding sample products...')
      const sample = [
        { name: 'Basmati Rice', category: 'Food', image: '', price: 299, weight: '1 kg', quantity: 'Pack of 1', description: 'Premium quality aged basmati rice' },
        { name: 'Cooking Oil', category: 'Cook', image: '', price: 189, weight: '1 L', quantity: 'Bottle', description: 'Refined sunflower cooking oil' },
        { name: 'Detergent Powder', category: 'Wash', image: '', price: 249, weight: '2 kg', quantity: 'Pack', description: 'Powerful cleaning detergent' }
      ]
      await Product.insertMany(sample)
      console.log('Sample products seeded')
    }

    // Ensure a default admin user exists for initial access
    try {
      const adminExists = await User.findOne({ isAdmin: true })
      if (!adminExists) {
        const defaultPassword = 'admin@123'
        const hashed = await bcrypt.hash(defaultPassword, 10)
        const adminUser = new User({
          name: 'Admin',
          username: 'admin',
          email: 'admin@admin.com',
          password: hashed,
          isAdmin: true
        })
        await adminUser.save()
        console.log('Default admin created -> username: admin  password: admin@123  email: admin@admin.com')
      } else {
        console.log('Admin user already exists')
      }
    } catch (err) {
      console.warn('Failed to ensure default admin user:', err.message)
    }

    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))
  })
  .catch(err => {
    // Enhanced logging with structured diagnostics
    console.error('Failed to connect to MongoDB:', {
      message: err.message,
      name: err.name,
      code: err.code,
      reason: err.reason && err.reason.message,
      stackTop: err.stack && err.stack.split('\n').slice(0, 3).join(' | ')
    })
    console.error('MongoDB connection guidance: 1) Whitelist your current IP in Atlas (or use 0.0.0.0/0 for dev), 2) Verify username/password, 3) Ensure cluster is ACTIVE/not paused, 4) Copy the full connection string from Atlas including retryWrites & appName params, 5) Check local firewall/VPN.')
    // Start server anyway for dev so other parts can respond (health, etc.)
    app.listen(PORT, () => console.log(`Server listening on port ${PORT} (db connection failed)`))
  })
