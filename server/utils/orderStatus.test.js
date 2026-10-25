import assert from 'node:assert/strict'
import test from 'node:test'
import { nextOrderStatus, normalizeOrderStatus, orderStatuses } from './orderStatus.js'

test('order status sequence progresses through all four preparation states', () => {
  assert.deepEqual(orderStatuses, ['Queued', 'In Progress', 'Ready for Pickup', 'Completed'])
  assert.equal(nextOrderStatus('Queued'), 'In Progress')
  assert.equal(nextOrderStatus('In Progress'), 'Ready for Pickup')
  assert.equal(nextOrderStatus('Ready for Pickup'), 'Completed')
  assert.equal(nextOrderStatus('Completed'), null)
})

test('legacy completed orders remain terminal', () => {
  assert.equal(normalizeOrderStatus('Completed / Taken'), 'Completed')
  assert.equal(nextOrderStatus('Completed / Taken'), null)
})
