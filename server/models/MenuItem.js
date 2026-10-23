import mongoose from 'mongoose'

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', trim: true, maxlength: 500 },
  price: { type: Number, required: true, min: 0.01 },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  imageUrl: {
    type: String,
    default: '',
    trim: true,
    maxlength: 2048,
    validate: {
      validator(value) {
        if (!value) return true
        try {
          return ['http:', 'https:'].includes(new URL(value).protocol)
        } catch {
          return false
        }
      },
      message: 'Image URL must be a valid HTTP or HTTPS URL.',
    },
  },
  available: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('MenuItem', menuItemSchema)
