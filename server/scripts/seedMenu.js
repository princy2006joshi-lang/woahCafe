import 'dotenv/config'
import mongoose from 'mongoose'
import MenuItem from '../models/MenuItem.js'
import menuItems from '../data/menuItems.js'

if (!process.env.MONGODB_URI) {
  console.error('Set MONGODB_URI in server/.env before seeding the menu.')
  process.exit(1)
}

try {
  await mongoose.connect(process.env.MONGODB_URI)
  const result = await MenuItem.bulkWrite(menuItems.map((item) => ({
    updateOne: {
      filter: { name: item.name, category: item.category },
      update: { $setOnInsert: item },
      upsert: true,
    },
  })))

  console.log(`Menu seed complete: ${result.upsertedCount} added, ${result.matchedCount} already present.`)
} catch (error) {
  console.error(`Could not seed menu: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
