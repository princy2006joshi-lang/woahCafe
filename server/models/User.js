import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, default: '', trim: true, maxlength: 30 },
  role: { type: String, enum: ['student', 'kitchen'], required: true, default: 'student' },
}, { timestamps: true })

export default mongoose.model('User', userSchema)
