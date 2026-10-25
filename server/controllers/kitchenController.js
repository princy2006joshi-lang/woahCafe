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

export async function listCounterPayments(request, response) {
  const orders = await Order.find({
    paymentMethod: 'counter',
    paymentStatus: 'pending',
  }).sort({ createdAt: 1 }).lean()
  return response.json({ orders })
}

export async function recordCounterPayment(request, response) {
  const order = await Order.findOneAndUpdate(
    {
      orderId: request.params.id,
      paymentMethod: 'counter',
      paymentStatus: 'pending',
    },
    {
      $set: {
        paymentStatus: 'paid',
        paidAt: new Date(),
        paymentRecordedBy: request.user._id,
      },
    },
    { new: true, runValidators: true },
  )
  if (order) {
    return response.json({ order })
  }

  const existingOrder = await Order.findOne({ orderId: request.params.id }).select('paymentMethod paymentStatus')
  if (!existingOrder) {
    return response.status(404).json({ message: 'Order not found.' })
  }
  if (existingOrder.paymentMethod !== 'counter') {
    return response.status(409).json({ message: 'This order is not payable at the café counter.' })
  }
  return response.status(409).json({ message: 'This counter payment has already been recorded.' })
}
