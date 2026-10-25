import assert from 'node:assert/strict'
import test from 'node:test'
import { clearSavedCart, loadSavedCart, saveCart } from './cartStorage.js'

function createStorage() {
  const values = new Map()
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      values.set(key, value)
    },
    removeItem(key) {
      values.delete(key)
    },
    values,
  }
}

const cart = {
  item1: {
    item: {
      _id: 'item1',
      name: 'Veg burger',
      description: '',
      category: 'Burgers',
      price: 89,
      imageUrl: '',
      available: true,
    },
    quantity: 2,
  },
}

test('cart storage saves and restores each student cart independently', () => {
  const storage = createStorage()
  saveCart('student-1', cart, storage)
  saveCart('student-2', {}, storage)

  assert.deepEqual(loadSavedCart('student-1', storage), cart)
  assert.deepEqual(loadSavedCart('student-2', storage), {})
})

test('cart storage reports malformed data rather than silently discarding it', () => {
  const storage = createStorage()
  storage.setItem('woah-cafe-cart:student-1', '{invalid')

  assert.throws(() => loadSavedCart('student-1', storage), /could not be read/)
})

test('cart storage rejects invalid or excessive item quantities', () => {
  const storage = createStorage()
  storage.setItem('woah-cafe-cart:student-1', JSON.stringify({
    ...cart,
    item2: { ...cart.item1, quantity: 51 },
  }))

  assert.throws(() => loadSavedCart('student-1', storage), /invalid item data/)
})

test('cart storage clears saved data after checkout', () => {
  const storage = createStorage()
  saveCart('student-1', cart, storage)
  clearSavedCart('student-1', storage)

  assert.deepEqual(loadSavedCart('student-1', storage), {})
})
