import Order from '../models/Order.js'
import { nextOrderStatus, orderStatuses } from '../utils/orderStatus.js'

export function counterPaymentUpdate(orderId, staffId, paidAt) {
  return {
    filter: {
      orderId,
      paymentMethod: 'counter',
      paymentStatus: 'pending',
    },
    update: {
      $set: {
        paymentStatus: 'paid',
        paidAt,
        paymentRecordedBy: staffId,
      },
    },
  }
}

export async function listKitchenOrders(request, response) {
  const view = request.query.view === 'history' ? 'history' : 'active'
  const statusFilter = view === 'history'
    ? { status: { $in: ['Completed', 'Completed / Taken'] } }
    : {
      status: { $nin: ['Completed', 'Completed / Taken'] },
      $or: [
        { paymentMethod: 'counter' },
        { paymentMethod: 'razorpay', paymentStatus: 'paid' },
      ],
    }
  const orders = await Order.find(statusFilter).sort({ createdAt: view === 'history' ? -1 : 1 }).lean()
  return response.json({ orders })
}

export async function updateOrderStatus(request, response) {
  const status = request.body?.status
  if (!orderStatuses.includes(status)) {
    return response.status(400).json({ message: 'Choose a valid order status.' })
  }

  const currentOrder = await Order.findOne({ orderId: request.params.id }).select('status paymentMethod paymentStatus')
  if (!currentOrder) {
    return response.status(404).json({ message: 'Order not found.' })
  }
  if (currentOrder.paymentMethod === 'razorpay' && currentOrder.paymentStatus !== 'paid') {
    return response.status(409).json({ message: 'Online orders can only be prepared after payment is confirmed.' })
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
  const paymentUpdate = counterPaymentUpdate(request.params.id, request.user._id, new Date())
  const order = await Order.findOneAndUpdate(
    paymentUpdate.filter,
    paymentUpdate.update,
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
