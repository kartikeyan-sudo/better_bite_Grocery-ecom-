const express = require('express')
const router = express.Router()
const Category = require('../models/Category')

// GET /api/categories - Get all active categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ displayOrder: 1, name: 1 })
    res.json(categories)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
