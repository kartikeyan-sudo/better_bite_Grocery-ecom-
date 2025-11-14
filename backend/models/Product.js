const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  weight: { type: String },
  quantity: { type: String },
  description: { type: String },
  inStock: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)
