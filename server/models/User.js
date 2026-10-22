import mongoose from 'mongoose'
import { isInstitutionalEmail } from '../utils/email.js'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator(email) {
        return this.role === 'kitchen' || isInstitutionalEmail(email)
      },
      message: 'Student accounts must use an @sst.scaler.com email address.',
    },
  },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, default: '', trim: true, maxlength: 30 },
  role: { type: String, enum: ['student', 'kitchen'], required: true, default: 'student' },
}, { timestamps: true })

export default mongoose.model('User', userSchema)
