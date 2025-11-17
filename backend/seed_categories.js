const mongoose = require('mongoose')
const Category = require('./models/Category')

const categories = [
  { name: 'Food', icon: '🍚', displayOrder: 1, isActive: true },
  { name: 'Cook', icon: '🍳', displayOrder: 2, isActive: true },
  { name: 'Wash', icon: '🧼', displayOrder: 3, isActive: true },
  { name: 'Care', icon: '💅', displayOrder: 4, isActive: true },
  { name: 'Drinks', icon: '🥤', displayOrder: 5, isActive: true },
  { name: 'Snacks', icon: '🍿', displayOrder: 6, isActive: true },
  { name: 'Dairy', icon: '🥛', displayOrder: 7, isActive: true },
]

async function seedCategories() {
  try {
    await mongoose.connect('mongodb://localhost:27017/better-bite')
    console.log('Connected to MongoDB')

    for (const cat of categories) {
      const existing = await Category.findOne({ name: cat.name })
      if (!existing) {
        await Category.create(cat)
        console.log(`Created category: ${cat.name}`)
      } else {
        console.log(`Category already exists: ${cat.name}`)
      }
    }

    console.log('✅ Categories seeded successfully!')
    process.exit(0)
  } catch (err) {
    console.error('Error seeding categories:', err)
    process.exit(1)
  }
}

seedCategories()
