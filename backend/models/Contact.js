const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({
  businessName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  whatsapp: { type: String },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
  
  // Business hours
  mondayToFriday: { type: String, default: '9:00 AM - 8:00 PM' },
  saturday: { type: String, default: '9:00 AM - 6:00 PM' },
  sunday: { type: String, default: '10:00 AM - 4:00 PM' },
  
  // Social media
  facebook: { type: String },
  instagram: { type: String },
  twitter: { type: String },
  
  // Additional info
  googleMapUrl: { type: String },
  description: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('Contact', contactSchema)
