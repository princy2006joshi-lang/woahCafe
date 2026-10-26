import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { test } from 'node:test'
import {
  createPaymentAttempt,
  createRazorpayOrder,
  placeOrder,
  recordRazorpayFailure,
  validateOrderItems,
  validatePaymentMethod,
  verifyPayment,
  verifyRazorpaySignature,
} from './orderController.js'
import Order from '../models/Order.js'
import MenuItem from '../models/MenuItem.js'

const itemId = '64b000000000000000000001'

test('order validation combines duplicate menu item quantities', () => {
  const result = validateOrderItems([
    { menuItemId: itemId, quantity: 2 },
    { menuItemId: itemId, quantity: 3 },
  ])

  assert.equal(result.error, undefined)
  assert.equal(result.quantities.get(itemId), 5)
})

test('order validation rejects empty, malformed, and excessive quantities', () => {
  assert.match(validateOrderItems([]).error, /between 1 and 30/)
  assert.match(validateOrderItems([{ menuItemId: 'invalid', quantity: 1 }]).error, /valid menu item ID/)
  assert.match(validateOrderItems([{ menuItemId: itemId, quantity: 0 }]).error, /valid menu item ID/)
  assert.match(validateOrderItems([
    { menuItemId: itemId, quantity: 30 },
    { menuItemId: itemId, quantity: 21 },
  ]).error, /cannot exceed 50/)
})

test('counter and Razorpay payments are accepted while unknown payment methods are rejected', () => {
  assert.equal(validatePaymentMethod('counter'), null)
  assert.equal(validatePaymentMethod('razorpay'), null)
  assert.match(validatePaymentMethod('online'), /valid payment method/)
  assert.match(validatePaymentMethod(undefined), /valid payment method/)
})

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }
}

function configureRazorpay(t) {
  const previousKeyId = process.env.RAZORPAY_KEY_ID
  const previousKeySecret = process.env.RAZORPAY_KEY_SECRET
  process.env.RAZORPAY_KEY_ID = 'test_key_id'
  process.env.RAZORPAY_KEY_SECRET = 'test_key_secret'
  t.after(() => {
    if (previousKeyId === undefined) delete process.env.RAZORPAY_KEY_ID
    else process.env.RAZORPAY_KEY_ID = previousKeyId
    if (previousKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET
    else process.env.RAZORPAY_KEY_SECRET = previousKeySecret
  })
}

test('Razorpay signature verification checks the order and payment pair', () => {
  const signature = createHmac('sha256', 'test_key_secret')
    .update('order_123|pay_123')
    .digest('hex')

  assert.equal(verifyRazorpaySignature('order_123', 'pay_123', signature, 'test_key_secret'), true)
  assert.equal(verifyRazorpaySignature('order_123', 'pay_other', signature, 'test_key_secret'), false)
  assert.equal(verifyRazorpaySignature('order_123', 'pay_123', 'not-a-signature', 'test_key_secret'), false)
})

test('Razorpay order creation sends the server-calculated amount in paise', async (t) => {
  configureRazorpay(t)
  let requestBody
  const fetch = t.mock.method(globalThis, 'fetch', async (_url, options) => {
    requestBody = JSON.parse(options.body)
    return new Response(JSON.stringify({
      id: 'order_gateway_123',
      amount: 2550,
      currency: 'INR',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })

  const paymentOrder = await createRazorpayOrder('cafe-order-123', 25.5)

  assert.deepEqual(requestBody, {
    amount: 2550,
    currency: 'INR',
    receipt: 'cafe-order-123',
  })
  assert.equal(paymentOrder.id, 'order_gateway_123')
  assert.equal(fetch.mock.callCount(), 1)
})

test('online order creation calculates the gateway amount from the database menu price', async (t) => {
  configureRazorpay(t)
  const databaseItem = {
    _id: itemId,
    name: 'Veg burger',
    price: 25.5,
  }
  t.mock.method(MenuItem, 'find', () => ({
    lean: async () => [databaseItem],
  }))
  let savedOrder
  t.mock.method(Order, 'create', async (order) => {
    savedOrder = order
    return order
  })
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    const requestBody = JSON.parse(options.body)
    return new Response(JSON.stringify({
      id: 'order_gateway_123',
      amount: requestBody.amount,
      currency: requestBody.currency,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
  const response = responseRecorder()

  await placeOrder({
    body: {
      items: [{ menuItemId: itemId, quantity: 2, price: 0.01 }],
      paymentMethod: 'razorpay',
    },
    user: {
      _id: 'student-id',
      name: 'Student',
      phone: '1234567890',
    },
  }, response)

  assert.equal(savedOrder.total, 51)
  assert.equal(savedOrder.items[0].priceAtOrder, 25.5)
  assert.equal(savedOrder.razorpayOrderId, 'order_gateway_123')
  assert.equal(response.body.payment.amount, 5100)
  assert.equal(response.statusCode, 201)
})

test('payment verification checks the Razorpay capture then atomically marks the owned order paid', async (t) => {
  configureRazorpay(t)
  const paymentId = 'pay_abc123'
  const gatewayOrderId = 'order_gateway_123'
  const signature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${gatewayOrderId}|${paymentId}`)
    .digest('hex')
  const order = {
    orderId: 'cafe-order-123',
    student: 'student-id',
    total: 25.5,
    paymentMethod: 'razorpay',
    paymentStatus: 'pending',
    razorpayOrderId: gatewayOrderId,
  }
  const paidOrder = { ...order, paymentStatus: 'paid', razorpayPaymentId: paymentId }
  t.mock.method(Order, 'findOne', async (filter) => {
    assert.deepEqual(filter, { orderId: 'cafe-order-123', student: 'student-id' })
    return order
  })
  const findOneAndUpdate = t.mock.method(Order, 'findOneAndUpdate', async (filter, update) => {
    assert.deepEqual(filter, {
      orderId: 'cafe-order-123',
      student: 'student-id',
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      razorpayOrderId: gatewayOrderId,
    })
    assert.deepEqual(update.$set, {
      paymentStatus: 'paid',
      razorpayPaymentId: paymentId,
      paidAt: new Date(1700000000000),
    })
    return paidOrder
  })
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    id: paymentId,
    order_id: gatewayOrderId,
    amount: 2550,
    currency: 'INR',
    status: 'captured',
    created_at: 1700000000,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  const response = responseRecorder()

  await verifyPayment({
    params: { id: 'cafe-order-123' },
    user: { _id: 'student-id' },
    body: { paymentId, signature },
  }, response)

  assert.equal(response.statusCode, 200, JSON.stringify(response.body))
  assert.equal(findOneAndUpdate.mock.callCount(), 1)
  assert.equal(response.body.order.paymentStatus, 'paid')
})

test('resuming an online checkout reconciles an already captured Razorpay payment', async (t) => {
  configureRazorpay(t)
  const order = {
    orderId: 'cafe-order-123',
    student: 'student-id',
    total: 25.5,
    paymentMethod: 'razorpay',
    paymentStatus: 'pending',
    razorpayOrderId: 'order_gateway_123',
  }
  const paidOrder = { ...order, paymentStatus: 'paid', razorpayPaymentId: 'pay_abc123' }
  t.mock.method(Order, 'findOne', async () => order)
  const findOneAndUpdate = t.mock.method(Order, 'findOneAndUpdate', async (filter, update) => {
    assert.equal(filter.paymentStatus, 'pending')
    assert.equal(update.$set.paymentStatus, 'paid')
    assert.equal(update.$set.razorpayPaymentId, 'pay_abc123')
    return paidOrder
  })
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    items: [{
      id: 'pay_abc123',
      order_id: 'order_gateway_123',
      amount: 2550,
      currency: 'INR',
      status: 'captured',
      created_at: 1700000000,
    }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  const response = responseRecorder()

  await createPaymentAttempt({
    params: { id: 'cafe-order-123' },
    user: { _id: 'student-id' },
  }, response)

  assert.equal(findOneAndUpdate.mock.callCount(), 1)
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.order.paymentStatus, 'paid')
  assert.equal(response.body.payment, undefined)
})

test('failed online payments are only recorded after the gateway confirms failure', async (t) => {
  configureRazorpay(t)
  const order = {
    orderId: 'cafe-order-123',
    student: 'student-id',
    total: 25.5,
    paymentMethod: 'razorpay',
    paymentStatus: 'pending',
    razorpayOrderId: 'order_gateway_123',
  }
  const failedOrder = { ...order, paymentStatus: 'failed' }
  t.mock.method(Order, 'findOne', async (filter) => {
    assert.deepEqual(filter, { orderId: 'cafe-order-123', student: 'student-id' })
    return order
  })
  const findOneAndUpdate = t.mock.method(Order, 'findOneAndUpdate', async (filter, update) => {
    assert.equal(filter.paymentStatus, 'pending')
    assert.equal(filter.razorpayOrderId, 'order_gateway_123')
    assert.deepEqual(update.$set, { paymentStatus: 'failed' })
    return failedOrder
  })
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    id: 'pay_abc123',
    order_id: 'order_gateway_123',
    amount: 2550,
    currency: 'INR',
    status: 'failed',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  const response = responseRecorder()

  await recordRazorpayFailure({
    params: { id: 'cafe-order-123' },
    user: { _id: 'student-id' },
    body: { paymentId: 'pay_abc123' },
  }, response)

  assert.equal(findOneAndUpdate.mock.callCount(), 1)
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.order.paymentStatus, 'failed')
})

test('order payment state defaults to pending and is separate from preparation status', () => {
  const order = new Order({
    orderId: 'order-test',
    student: new Order.base.Types.ObjectId(),
    studentName: 'Student',
    studentPhone: '1234567890',
    items: [{
      menuItem: new Order.base.Types.ObjectId(),
      name: 'Chai',
      quantity: 1,
      priceAtOrder: 25,
    }],
    total: 25,
    status: 'Ready for Pickup',
  })

  assert.equal(order.paymentMethod, 'counter')
  assert.equal(order.paymentStatus, 'pending')
  assert.equal(order.status, 'Ready for Pickup')
  assert.equal(order.validateSync(), undefined)
})

test('Razorpay orders validate pending, paid, and failed payment states separately from preparation', () => {
  const order = new Order({
    orderId: 'order-razorpay-test',
    student: new Order.base.Types.ObjectId(),
    studentName: 'Student',
    studentPhone: '1234567890',
    items: [{
      menuItem: new Order.base.Types.ObjectId(),
      name: 'Chai',
      quantity: 1,
      priceAtOrder: 25,
    }],
    total: 25,
    paymentMethod: 'razorpay',
    paymentStatus: 'failed',
    razorpayOrderId: 'order_gateway_123',
    status: 'Queued',
  })

  assert.equal(order.validateSync(), undefined)
})

test('new orders start in the queued preparation state', () => {
  const order = new Order({
    orderId: 'order-queued-test',
    student: new Order.base.Types.ObjectId(),
    studentName: 'Student',
    studentPhone: '1234567890',
    items: [{
      menuItem: new Order.base.Types.ObjectId(),
      name: 'Chai',
      quantity: 1,
      priceAtOrder: 25,
    }],
    total: 25,
  })

  assert.equal(order.status, 'Queued')
  assert.equal(order.validateSync(), undefined)
})
