require('dotenv').config()
const mongoose = require('mongoose')
const Category = require('./models/Category')
const Product = require('./models/Product')

async function addFruits() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB Atlas\n')

    // Create Fruits category
    const fruitsCategory = await Category.findOne({ name: 'Fruits' })
    if (!fruitsCategory) {
      await Category.create({
        name: 'Fruits',
        icon: '🍎',
        displayOrder: 8,
        isActive: true
      })
      console.log('✓ Created Fruits category')
    } else {
      console.log('- Fruits category already exists')
    }

    // Add some fruit products
    const fruitProducts = [
      {
        name: 'Fresh Apples',
        category: 'Fruits',
        image: '🍎',
        price: 120,
        mrp: 150,
        weight: '1 kg',
        quantity: 'Pack of 4-5',
        description: 'Fresh red apples, crisp and sweet',
        inStock: true,
        recommended: true
      },
      {
        name: 'Bananas',
        category: 'Fruits',
        image: '🍌',
        price: 40,
        mrp: 50,
        weight: '500 g',
        quantity: 'Bunch',
        description: 'Ripe yellow bananas, naturally sweet',
        inStock: true,
        recommended: false
      },
      {
        name: 'Fresh Oranges',
        category: 'Fruits',
        image: '🍊',
        price: 80,
        mrp: 100,
        weight: '1 kg',
        quantity: 'Pack of 6-8',
        description: 'Juicy oranges, rich in vitamin C',
        inStock: true,
        recommended: false
      },
      {
        name: 'Grapes',
        category: 'Fruits',
        image: '🍇',
        price: 60,
        mrp: 80,
        weight: '500 g',
        quantity: 'Pack',
        description: 'Seedless green grapes, fresh and sweet',
        inStock: true,
        recommended: false
      },
      {
        name: 'Mangoes',
        category: 'Fruits',
        image: '🥭',
        price: 200,
        mrp: 250,
        weight: '1 kg',
        quantity: 'Pack of 3-4',
        description: 'Alphonso mangoes, king of fruits',
        inStock: true,
        recommended: true
      }
    ]

    for (const product of fruitProducts) {
      const existing = await Product.findOne({ name: product.name })
      if (!existing) {
        await Product.create(product)
        console.log(`✓ Added product: ${product.name}`)
      } else {
        console.log(`- Product already exists: ${product.name}`)
      }
    }

    console.log('\n✅ Fruits category and products added successfully!')
    console.log('Now you can search for "fruits" to see all fruit products.')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

addFruits()
