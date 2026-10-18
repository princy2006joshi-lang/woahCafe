import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '../models/User.js'

const { KITCHEN_EMAIL, KITCHEN_PASSWORD, KITCHEN_NAME } = process.env

if (!process.env.MONGODB_URI || !KITCHEN_EMAIL || !KITCHEN_PASSWORD || !process.env.JWT_SECRET) {
  console.error('Set MONGODB_URI, JWT_SECRET, KITCHEN_EMAIL, and KITCHEN_PASSWORD in server/.env first.')
  process.exit(1)
}

if (KITCHEN_PASSWORD.length < 12 || Buffer.byteLength(KITCHEN_PASSWORD, 'utf8') > 72) {
  console.error('KITCHEN_PASSWORD must be at least 12 characters and no more than 72 UTF-8 bytes.')
  process.exit(1)
}

try {
  await mongoose.connect(process.env.MONGODB_URI)
  const email = KITCHEN_EMAIL.trim().toLowerCase()
  const existingUser = await User.findOne({ email })
  if (existingUser) {
    throw new Error('That email already belongs to an account. No account was changed.')
  }

  const passwordHash = await bcrypt.hash(KITCHEN_PASSWORD, 12)
  await User.create({
    name: KITCHEN_NAME?.trim() || 'Kitchen Staff',
    email,
    passwordHash,
    role: 'kitchen',
  })
  console.log(`Kitchen login created for ${email}.`)
} catch (error) {
  console.error(`Could not create kitchen login: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}