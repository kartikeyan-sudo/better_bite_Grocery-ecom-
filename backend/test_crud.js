/* Quick CRUD smoke test for products

   Usage (PowerShell):
   cd "c:\Users\Kartikeyan Dubey\Desktop\ecomm part 2\backend"
   node test_crud.js

   The script will:
   - Connect to the MongoDB URL from process.env.MONGO_URI
   - List up to 5 products
   - Insert a temporary test product
   - Read it back
   - Delete the test product
*/

const mongoose = require('mongoose')
require('dotenv').config()

const Product = require('./models/Product')

async function run() {
  const uri = process.env.MONGO_URI
  if (!uri) {
    console.error('No MONGO_URI found in environment. Copy .env.example to .env and set MONGO_URI.')
    process.exit(1)
  }

  try {
    console.log('Connecting to', uri)
    await mongoose.connect(uri)
    console.log('Connected to MongoDB')

    console.log('\nListing up to 5 products:')
    const list = await Product.find().limit(5)
    console.log(list)

    console.log('\nInserting test product...')
    const test = new Product({
      name: 'Test Product - temp',
      category: 'Test',
      price: 10,
      weight: '100 g',
      quantity: '1',
      description: 'Temporary product created by test script'
    })
    const saved = await test.save()
    console.log('Inserted:', saved)

    console.log('\nReading back test product by id...')
    const found = await Product.findById(saved._id)
    console.log('Found:', found)

    console.log('\nDeleting test product...')
    await Product.findByIdAndDelete(saved._id)
    console.log('Deleted.')

    console.log('\nDone. Closing connection.')
    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('Error during test:', err)
    try { await mongoose.disconnect() } catch(e){}
    process.exit(1)
  }
}

run()
