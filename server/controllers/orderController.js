import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import MenuItem from '../models/MenuItem.js'
import Order from '../models/Order.js'

export function validateOrderItems(entries) {
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > 30) {
    return { error: 'Add between 1 and 30 items to your order.' }
  }

  const quantities = new Map()
  for (const entry of entries) {
    const id = entry?.menuItemId
    const quantity = entry?.quantity
    if (!mongoose.isValidObjectId(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return { error: 'Each item needs a valid menu item ID and quantity.' }
    }
    const normalizedId = id.toString()
    const combinedQuantity = (quantities.get(normalizedId) || 0) + quantity
    if (combinedQuantity > 50) {
      return { error: 'An item quantity cannot exceed 50.' }
    }
    quantities.set(normalizedId, combinedQuantity)
  }
  return { quantities }
}

export function validatePaymentMethod(paymentMethod) {
  return paymentMethod === 'counter' ? null : 'Pay at the café is the only available payment method.'
}

export async function placeOrder(request, response) {
  const body = request.body || {}
  const { error, quantities } = validateOrderItems(body.items)
  if (error) {
    return response.status(400).json({ message: error })
  }
  const paymentError = validatePaymentMethod(body.paymentMethod)
  if (paymentError) {
    return response.status(400).json({ message: paymentError })
  }

  const menuItems = await MenuItem.find({
    _id: { $in: [...quantities.keys()] },
    available: true,
  }).lean()
  if (menuItems.length !== quantities.size) {
    return response.status(409).json({ message: 'A selected item is no longer available. Refresh the menu.' })
  }

  let totalCents = 0
  const items = menuItems.map((menuItem) => {
    const quantity = quantities.get(menuItem._id.toString())
    const priceCents = Math.round(menuItem.price * 100)
    totalCents += priceCents * quantity
    return {
      menuItem: menuItem._id,
      name: menuItem.name,
      quantity,
      priceAtOrder: priceCents / 100,
    }
  })

  const order = await Order.create({
    orderId: randomUUID(),
    student: request.user._id,
    studentName: request.user.name,
    studentPhone: request.user.phone,
    items,
    total: totalCents / 100,
    paymentMethod: 'counter',
    paymentStatus: 'pending',
    status: 'Queued',
  })

  return response.status(201).json({ order })
}

export async function listMyOrders(request, response) {
  const orders = await Order.find({ student: request.user._id }).sort({ createdAt: -1 }).lean()
  return response.json({ orders })
}

export async function getMyOrder(request, response) {
  const order = await Order.findOne({
    orderId: request.params.id,
    student: request.user._id,
  }).lean()
  if (!order) {
    return response.status(404).json({ message: 'Order not found.' })
  }

  return response.json({ order })
}
