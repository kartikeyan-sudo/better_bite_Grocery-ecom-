const express = require('express')
const router = express.Router()
const Product = require('../models/Product')

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    const filter = {}
    if (category) filter.category = category
    const products = await Product.find(filter).sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id)
    if (!p) return res.status(404).json({ error: 'Product not found' })
    res.json(p)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// Admin: POST /api/products - create product (not protected here)
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body)
    await product.save()
    res.status(201).json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
