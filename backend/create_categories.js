require('dotenv').config()
const mongoose = require('mongoose')
const Category = require('./models/Category')

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB Atlas\n')

    const categoriesToCreate = [
      { name: 'Food', icon: '🍚', displayOrder: 1, isActive: true },
      { name: 'Cook', icon: '🍳', displayOrder: 2, isActive: true },
      { name: 'Wash', icon: '🧼', displayOrder: 3, isActive: true },
      { name: 'Care', icon: '💅', displayOrder: 4, isActive: true },
      { name: 'Drinks', icon: '🥤', displayOrder: 5, isActive: true },
      { name: 'Snacks', icon: '🍿', displayOrder: 6, isActive: true },
      { name: 'Dairy', icon: '🥛', displayOrder: 7, isActive: true },
    ]

    for (const cat of categoriesToCreate) {
      const existing = await Category.findOne({ name: cat.name })
      if (!existing) {
        await Category.create(cat)
        console.log(`✓ Created category: ${cat.name}`)
      } else {
        console.log(`- Category already exists: ${cat.name}`)
      }
    }

    console.log('\n✅ Categories setup complete!')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

seedCategories()
