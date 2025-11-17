require('dotenv').config()
const mongoose = require('mongoose')
const Category = require('./models/Category')
const Product = require('./models/Product')

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB Atlas\n')

    const cats = await Category.find().sort({ displayOrder: 1 })
    const prods = await Product.find()

    console.log('=== CATEGORIES IN DATABASE ===')
    if (cats.length === 0) {
      console.log('  NO CATEGORIES FOUND!')
    } else {
      cats.forEach(c => console.log(`  ✓ "${c.name}" (${c.icon}) - Active: ${c.isActive}`))
    }

    console.log('\n=== PRODUCTS IN DATABASE ===')
    if (prods.length === 0) {
      console.log('  NO PRODUCTS FOUND!')
    } else {
      prods.forEach(p => console.log(`  • ${p.name} -> category: "${p.category}"`))
    }

    console.log('\n=== ANALYSIS ===')
    const categoryNames = cats.filter(c => c.isActive).map(c => c.name)
    const productCategories = [...new Set(prods.map(p => p.category))]
    
    console.log('Active category names:', categoryNames)
    console.log('Product categories used:', productCategories)
    
    const mismatches = productCategories.filter(pc => !categoryNames.includes(pc))
    if (mismatches.length > 0) {
      console.log('\n⚠️  PROBLEM FOUND: These product categories don\'t have matching Category entries:')
      mismatches.forEach(m => console.log(`   - "${m}"`))
      console.log('\nSOLUTION: Create categories with these exact names, or update products to use existing category names.')
    } else {
      console.log('\n✅ All product categories have matching Category entries!')
    }

    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

checkData()
