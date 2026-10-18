import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import MenuItem from '../models/MenuItem.js'
import Order from '../models/Order.js'

export async function placeOrder(request, response) {
  if (!Array.isArray(request.body.items) || request.body.items.length === 0 || request.body.items.length > 30) {
    return response.status(400).json({ message: 'Add between 1 and 30 items to your order.' })
  }

  const quantities = new Map()
  for (const entry of request.body.items) {
    const id = entry?.menuItemId
    const quantity = entry?.quantity
    if (!mongoose.isValidObjectId(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return response.status(400).json({ message: 'Each item needs a valid menu item ID and quantity.' })
    }
    const combinedQuantity = (quantities.get(id) || 0) + quantity
    if (combinedQuantity > 50) {
      return response.status(400).json({ message: 'An item quantity cannot exceed 50.' })
    }
    quantities.set(id, combinedQuantity)
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
    status: 'In Progress',
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
