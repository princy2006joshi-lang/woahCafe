import assert from 'node:assert/strict'
import test from 'node:test'
import { validateOrderItems, validatePaymentMethod } from './orderController.js'
import Order from '../models/Order.js'

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

test('only counter payment is accepted until online checkout is implemented', () => {
  assert.equal(validatePaymentMethod('counter'), null)
  assert.match(validatePaymentMethod('online'), /only available payment method/)
  assert.match(validatePaymentMethod(undefined), /only available payment method/)
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
