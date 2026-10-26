import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import mongoose from 'mongoose'
import MenuItem from '../models/MenuItem.js'
import Order from '../models/Order.js'

const RAZORPAY_BASE_URL = 'https://api.razorpay.com/v1'
const PAYMENT_CURRENCY = 'INR'
const PAYMENT_METHODS = ['counter', 'razorpay']

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
  return PAYMENT_METHODS.includes(paymentMethod) ? null : 'Choose a valid payment method.'
}

function razorpayConfiguration() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
  if (!keyId || !keySecret) {
    const error = new Error('Online payments are not configured. Add Razorpay keys to server/.env.')
    error.statusCode = 503
    throw error
  }
  return { keyId, keySecret }
}

async function razorpayRequest(path, options = {}) {
  const { keyId, keySecret } = razorpayConfiguration()
  let response
  try {
    response = await fetch(`${RAZORPAY_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    const error = new Error('Could not reach the online payment service. Please try again.')
    error.statusCode = 502
    throw error
  }

  if (!response.ok) {
    const error = new Error('The online payment service could not complete the request.')
    error.statusCode = 502
    throw error
  }
  try {
    return await response.json()
  } catch {
    const error = new Error('The online payment service returned an invalid response.')
    error.statusCode = 502
    throw error
  }
}

export async function createRazorpayOrder(orderId, amount) {
  const amountInPaise = Math.round(amount * 100)
  const paymentOrder = await razorpayRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountInPaise,
      currency: PAYMENT_CURRENCY,
      receipt: orderId,
    }),
  })
  if (
    typeof paymentOrder.id !== 'string'
    || paymentOrder.amount !== amountInPaise
    || paymentOrder.currency !== PAYMENT_CURRENCY
  ) {
    const error = new Error('The online payment service returned an invalid order.')
    error.statusCode = 502
    throw error
  }
  return paymentOrder
}

async function getRazorpayPayment(paymentId) {
  if (typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) {
    return null
  }
  return razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`)
}

async function listRazorpayPayments(orderId) {
  const result = await razorpayRequest(`/orders/${encodeURIComponent(orderId)}/payments`)
  return Array.isArray(result.items) ? result.items : []
}

export function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  if (typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest()
  const supplied = Buffer.from(signature, 'hex')
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}

function checkoutDetails(order, keyId) {
  return {
    keyId,
    orderId: order.razorpayOrderId,
    amount: Math.round(order.total * 100),
    currency: PAYMENT_CURRENCY,
  }
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

  const orderId = randomUUID()
  const paymentMethod = body.paymentMethod
  let paymentOrder
  let keyId
  if (paymentMethod === 'razorpay') {
    ({ keyId } = razorpayConfiguration())
    paymentOrder = await createRazorpayOrder(orderId, totalCents / 100)
  }

  const order = await Order.create({
    orderId,
    student: request.user._id,
    studentName: request.user.name,
    studentPhone: request.user.phone,
    items,
    total: totalCents / 100,
    paymentMethod,
    paymentStatus: 'pending',
    ...(paymentOrder ? { razorpayOrderId: paymentOrder.id } : {}),
    status: 'Queued',
  })

  return response.status(201).json({
    order,
    ...(paymentOrder ? { payment: checkoutDetails(order, keyId) } : {}),
  })
}

export async function createPaymentAttempt(request, response) {
  const order = await Order.findOne({
    orderId: request.params.id,
    student: request.user._id,
  })
  if (!order) {
    return response.status(404).json({ message: 'Order not found.' })
  }
  if (order.paymentMethod !== 'razorpay') {
    return response.status(409).json({ message: 'This order does not use online payment.' })
  }
  if (order.paymentStatus === 'paid') {
    return response.status(409).json({ message: 'This order has already been paid.' })
  }

  const { keyId } = razorpayConfiguration()
  if (order.paymentStatus === 'failed' || !order.razorpayOrderId) {
    const paymentOrder = await createRazorpayOrder(order.orderId, order.total)
    const previousPaymentOrderId = order.razorpayOrderId
    const updatedOrder = await Order.findOneAndUpdate(
      {
        orderId: order.orderId,
        student: request.user._id,
        paymentStatus: order.paymentStatus,
        razorpayOrderId: previousPaymentOrderId ?? null,
      },
      {
        $set: {
          paymentStatus: 'pending',
          razorpayOrderId: paymentOrder.id,
        },
      },
      { new: true, runValidators: true },
    )
    if (!updatedOrder) {
      return response.status(409).json({ message: 'The payment attempt changed. Refresh and try again.' })
    }
    return response.json({ order: updatedOrder, payment: checkoutDetails(updatedOrder, keyId) })
  }

  const capturedPayment = (await listRazorpayPayments(order.razorpayOrderId)).find((payment) => (
    typeof payment.id === 'string'
    && /^pay_[A-Za-z0-9]+$/.test(payment.id)
    && payment.order_id === order.razorpayOrderId
    && payment.amount === Math.round(order.total * 100)
    && payment.currency === PAYMENT_CURRENCY
    && payment.status === 'captured'
  ))
  if (capturedPayment) {
    const updatedOrder = await Order.findOneAndUpdate(
      {
        orderId: order.orderId,
        student: request.user._id,
        paymentStatus: 'pending',
        razorpayOrderId: order.razorpayOrderId,
      },
      {
        $set: {
          paymentStatus: 'paid',
          razorpayPaymentId: capturedPayment.id,
          paidAt: capturedPayment.created_at ? new Date(capturedPayment.created_at * 1000) : new Date(),
        },
      },
      { new: true, runValidators: true },
    )
    if (updatedOrder) {
      return response.json({ order: updatedOrder })
    }
    const latestOrder = await Order.findOne({ orderId: order.orderId, student: request.user._id })
    if (latestOrder?.paymentStatus === 'paid') {
      return response.json({ order: latestOrder })
    }
    return response.status(409).json({ message: 'The order payment changed. Refresh and check its status.' })
  }

  return response.json({ order, payment: checkoutDetails(order, keyId) })
}

export async function verifyPayment(request, response) {
  const { paymentId, signature } = request.body || {}
  const order = await Order.findOne({
    orderId: request.params.id,
    student: request.user._id,
  })
  if (!order) {
    return response.status(404).json({ message: 'Order not found.' })
  }
  if (order.paymentMethod !== 'razorpay') {
    return response.status(409).json({ message: 'This order does not use online payment.' })
  }
  if (order.paymentStatus === 'paid') {
    return order.razorpayPaymentId === paymentId
      ? response.json({ order })
      : response.status(409).json({ message: 'A different payment has already been recorded.' })
  }
  if (!order.razorpayOrderId || !verifyRazorpaySignature(
    order.razorpayOrderId,
    paymentId,
    signature,
    razorpayConfiguration().keySecret,
  )) {
    return response.status(400).json({ message: 'The payment signature could not be verified.' })
  }

  const payment = await getRazorpayPayment(paymentId)
  if (!payment) {
    return response.status(400).json({ message: 'The payment details are invalid.' })
  }
  if (
    payment.order_id !== order.razorpayOrderId
    || payment.amount !== Math.round(order.total * 100)
    || payment.currency !== PAYMENT_CURRENCY
    || payment.status !== 'captured'
  ) {
    return response.status(409).json({ message: 'The payment is not captured for this order.' })
  }

  const paidAt = payment.created_at ? new Date(payment.created_at * 1000) : new Date()
  const updatedOrder = await Order.findOneAndUpdate(
    {
      orderId: order.orderId,
      student: request.user._id,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      razorpayOrderId: order.razorpayOrderId,
    },
    {
      $set: {
        paymentStatus: 'paid',
        razorpayPaymentId: paymentId,
        paidAt,
      },
    },
    { new: true, runValidators: true },
  )
  if (updatedOrder) {
    return response.json({ order: updatedOrder })
  }

  const latestOrder = await Order.findOne({ orderId: order.orderId, student: request.user._id })
  if (latestOrder?.paymentStatus === 'paid' && latestOrder.razorpayPaymentId === paymentId) {
    return response.json({ order: latestOrder })
  }
  return response.status(409).json({ message: 'The order payment changed. Refresh and check its status.' })
}

export async function recordRazorpayFailure(request, response) {
  const { paymentId } = request.body || {}
  const order = await Order.findOne({
    orderId: request.params.id,
    student: request.user._id,
  })
  if (!order) {
    return response.status(404).json({ message: 'Order not found.' })
  }
  if (order.paymentMethod !== 'razorpay' || !order.razorpayOrderId) {
    return response.status(409).json({ message: 'This order does not have an active online payment.' })
  }
  if (order.paymentStatus === 'paid') {
    return response.status(409).json({ message: 'A payment is already recorded for this order.' })
  }

  const payment = await getRazorpayPayment(paymentId)
  if (!payment || payment.order_id !== order.razorpayOrderId) {
    return response.status(400).json({ message: 'The failed payment details could not be verified.' })
  }
  if (
    payment.amount !== Math.round(order.total * 100)
    || payment.currency !== PAYMENT_CURRENCY
    || payment.status !== 'failed'
  ) {
    return response.status(409).json({ message: 'The payment is not confirmed as failed.' })
  }

  const updatedOrder = await Order.findOneAndUpdate(
    {
      orderId: order.orderId,
      student: request.user._id,
      paymentStatus: 'pending',
      razorpayOrderId: order.razorpayOrderId,
    },
    { $set: { paymentStatus: 'failed' } },
    { new: true, runValidators: true },
  )
  if (!updatedOrder) {
    return response.status(409).json({ message: 'The order payment changed. Refresh and check its status.' })
  }
  return response.json({ order: updatedOrder })
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
