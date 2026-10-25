import Order from '../models/Order.js'
import { nextOrderStatus, orderStatuses } from '../utils/orderStatus.js'

export async function listKitchenOrders(request, response) {
  const view = request.query.view === 'history' ? 'history' : 'active'
  const statusFilter = view === 'history'
    ? { status: { $in: ['Completed', 'Completed / Taken'] } }
    : { status: { $nin: ['Completed', 'Completed / Taken'] } }
  const orders = await Order.find(statusFilter).sort({ createdAt: view === 'history' ? -1 : 1 }).lean()
  return response.json({ orders })
}

export async function updateOrderStatus(request, response) {
  const status = request.body?.status
  if (!orderStatuses.includes(status)) {
    return response.status(400).json({ message: 'Choose a valid order status.' })
  }

  const currentOrder = await Order.findOne({ orderId: request.params.id }).select('status')
  if (!currentOrder) {
    return response.status(404).json({ message: 'Order not found.' })
  }

  if (nextOrderStatus(currentOrder.status) !== status) {
    return response.status(409).json({ message: 'Orders can only move to the next status.' })
  }

  const order = await Order.findOneAndUpdate(
    { orderId: request.params.id, status: currentOrder.status },
    { $set: { status } },
    { new: true, runValidators: true },
  )
  if (!order) {
    return response.status(409).json({ message: 'The order was updated by another kitchen session. Refresh and try again.' })
  }
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
