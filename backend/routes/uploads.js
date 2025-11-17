const express = require('express')
const router = express.Router()
const multer = require('multer')
const adminAuth = require('../middleware/adminAuth')
const cloudinary = require('../config/cloudinary')

const storage = multer.memoryStorage()
const upload = multer({ storage })

// POST /api/admin/uploads/image - Upload an image file or URL to Cloudinary
router.post('/image', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const imageUrl = req.body.imageUrl

    const doRespond = (result) => res.json({
      url: result.secure_url || result.url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    })

    if (imageUrl) {
      const result = await cloudinary.uploader.upload(imageUrl, { folder: 'ecomm_products' })
      return doRespond(result)
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file or imageUrl provided' })
    }

    // Use upload_stream for memory buffer
    const stream = cloudinary.uploader.upload_stream({ folder: 'ecomm_products' }, (err, result) => {
      if (err) {
        console.error('Cloudinary upload error:', err)
        return res.status(500).json({ error: 'Upload failed' })
      }
      return doRespond(result)
    })

    stream.end(req.file.buffer)
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
