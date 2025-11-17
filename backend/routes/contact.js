const express = require('express')
const Contact = require('../models/Contact')

const router = express.Router()

// GET /api/contact - Public endpoint to get contact information
router.get('/', async (req, res) => {
  try {
    let contact = await Contact.findOne()
    
    // If no contact info exists, return default
    if (!contact) {
      contact = {
        businessName: 'Better Bite',
        email: 'info@betterbite.com',
        phone: '+91 98765 43210',
        address: '123 Market Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      }
    }
    
    res.json(contact)
  } catch (err) {
    console.error('Error fetching contact info:', err)
    res.status(500).json({ error: 'Failed to fetch contact information' })
  }
})

module.exports = router
