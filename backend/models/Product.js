const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String },
  // price is the current/offer/sale price
  price: { type: Number, required: true },
  // mrp is the original list price before discount
  mrp: { type: Number },
  weight: { type: String },
  quantity: { type: String },
  description: { type: String },
  inStock: { type: Boolean, default: true },
  recommended: { type: Boolean, default: false },
  // purchaseLimit is the maximum quantity a single user can purchase (null = no limit)
  purchaseLimit: { type: Number, default: null }
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)
