require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const { initBot } = require('./services/telegramBot')

const authRouter = require('./routes/auth')
const usersRouter = require('./routes/users')
const productsRouter = require('./routes/products')
const ordersRouter = require('./routes/orders')
const cartRouter = require('./routes/cart')
const adminRouter = require('./routes/admin')
const uploadsRouter = require('./routes/uploads')
const categoriesRouter = require('./routes/categories')
const contactRouter = require('./routes/contact')

const app = express()

// Configure CORS to allow requests from the frontend when hosted separately.
// Set `CORS_ORIGIN` in `backend/.env` to a comma-separated list of allowed origins,
// e.g. `CORS_ORIGIN=http://localhost:5173,https://www.yourfrontend.com`.
const allowedOriginsEnv = process.env.CORS_ORIGIN || ''
const allowedOrigins = allowedOriginsEnv.split(',').map(s => s.trim()).filter(Boolean)


app.use(cors())

app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/cart', cartRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/contact', contactRouter)
app.use('/api/admin', adminRouter)
app.use('/api/admin/uploads', uploadsRouter)

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecomm'

// Attempt initial MongoDB connection
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB')
    
    // Seed default categories if none exist
    const Category = require('./models/Category')
    const categoryCount = await Category.countDocuments()
    if (categoryCount === 0) {
      console.log('Seeding default categories...')
      const defaultCategories = [
        { name: 'Food', icon: '🍚', displayOrder: 1, isActive: true },
        { name: 'Cook', icon: '🍳', displayOrder: 2, isActive: true },
        { name: 'Wash', icon: '🧼', displayOrder: 3, isActive: true },
        { name: 'Care', icon: '💅', displayOrder: 4, isActive: true },
        { name: 'Drinks', icon: '🥤', displayOrder: 5, isActive: true },
        { name: 'Snacks', icon: '🍿', displayOrder: 6, isActive: true },
        { name: 'Dairy', icon: '🥛', displayOrder: 7, isActive: true },
      ]
      await Category.insertMany(defaultCategories)
      console.log('Default categories seeded')
    }
    
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

    // Seed default contact information if none exists
    const Contact = require('./models/Contact')
    const contactCount = await Contact.countDocuments()
    if (contactCount === 0) {
      console.log('Seeding default contact information...')
      await Contact.create({
        businessName: 'Better Bite',
        email: 'info@betterbite.com',
        phone: '+91 98765 43210',
        alternatePhone: '+91 98765 43211',
        address: '123 Market Street, Near City Mall',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        mondayToFriday: '9:00 AM - 8:00 PM',
        saturday: '9:00 AM - 6:00 PM',
        sunday: '10:00 AM - 4:00 PM',
        description: 'Your trusted grocery store for fresh produce, daily essentials, and quality products at the best prices.'
      })
      console.log('Default contact information seeded')
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

    // Initialize Telegram Bot
    initBot()

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
