import Order from '../models/Order.js'

const statusSequence = ['In Progress', 'Ready for Pickup', 'Completed / Taken']

export async function listKitchenOrders(request, response) {
  const view = request.query.view === 'history' ? 'history' : 'active'
  const statusFilter = view === 'history'
    ? { status: 'Completed / Taken' }
    : { status: { $ne: 'Completed / Taken' } }
  const orders = await Order.find(statusFilter).sort({ createdAt: view === 'history' ? -1 : 1 }).lean()
  return response.json({ orders })
}

export async function updateOrderStatus(request, response) {
  const { status } = request.body
  const nextIndex = statusSequence.indexOf(status)
  if (nextIndex < 0) {
    return response.status(400).json({ message: 'Choose a valid order status.' })
  }

  const order = await Order.findOne({ orderId: request.params.id })
  if (!order) {
    return response.status(404).json({ message: 'Order not found.' })
  }

  const currentIndex = statusSequence.indexOf(order.status)
  if (nextIndex !== currentIndex + 1) {
    return response.status(409).json({ message: 'Orders can only move to the next status.' })
  }

  order.status = status
  await order.save()
  return response.json({ order })
}
