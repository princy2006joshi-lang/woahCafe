import assert from 'node:assert/strict'
import { mock, test } from 'node:test'
import Order from '../models/Order.js'
import { counterPaymentUpdate, recordCounterPayment } from './kitchenController.js'

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

test('counter payment transition is atomic and only targets pending counter payments', () => {
  const staffId = 'staff-id'
  const paidAt = new Date('2026-10-26T08:00:00.000Z')
  const transition = counterPaymentUpdate('order-reference', staffId, paidAt)

  assert.deepEqual(transition.filter, {
    orderId: 'order-reference',
    paymentMethod: 'counter',
    paymentStatus: 'pending',
  })
  assert.deepEqual(transition.update, {
    $set: {
      paymentStatus: 'paid',
      paidAt,
      paymentRecordedBy: staffId,
    },
  })
})

test('counter-payment handler records payment for the pending order and authenticated staff member', async (t) => {
  const paidOrder = { orderId: 'order-reference', paymentStatus: 'paid' }
  const findOneAndUpdate = t.mock.method(Order, 'findOneAndUpdate', async (filter, update) => {
    assert.deepEqual(filter, {
      orderId: 'order-reference',
      paymentMethod: 'counter',
      paymentStatus: 'pending',
    })
    assert.equal(update.$set.paymentRecordedBy, 'staff-id')
    assert.ok(update.$set.paidAt instanceof Date)
    return paidOrder
  })
  const response = responseRecorder()

  await recordCounterPayment({
    params: { id: 'order-reference' },
    user: { _id: 'staff-id' },
  }, response)

  assert.equal(findOneAndUpdate.mock.callCount(), 1)
  assert.equal(response.statusCode, 200)
  assert.equal(response.body.order, paidOrder)
})

test('counter-payment handler rejects a duplicate payment without recording it again', async (t) => {
  t.mock.method(Order, 'findOneAndUpdate', async () => null)
  t.mock.method(Order, 'findOne', () => ({
    select: async () => ({ paymentMethod: 'counter', paymentStatus: 'paid' }),
  }))
  const response = responseRecorder()

  await recordCounterPayment({
    params: { id: 'order-reference' },
    user: { _id: 'staff-id' },
  }, response)

  assert.equal(response.statusCode, 409)
  assert.match(response.body.message, /already been recorded/)
})
