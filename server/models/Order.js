import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  priceAtOrder: { type: Number, required: true, min: 0 },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  studentName: { type: String, required: true },
  studentPhone: { type: String, required: true },
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['In Progress', 'Ready for Pickup', 'Completed / Taken'],
    default: 'In Progress',
    required: true,
  },
}, { timestamps: true })

export default mongoose.model('Order', orderSchema)
