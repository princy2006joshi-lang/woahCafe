import assert from 'node:assert/strict'
import test from 'node:test'
import menuItems from './menuItems.js'

test('menu seed contains five quick-to-prepare options in each requested category', () => {
  const categories = ['Burgers', 'Sandwiches', 'Beverages', 'Maggis', 'Rolls', 'Omelettes']
  assert.equal(menuItems.length, 30)

  for (const category of categories) {
    const items = menuItems.filter((item) => item.category === category)
    assert.equal(items.length, 5, `${category} should contain five items`)
    assert.ok(items.every((item) => item.available && item.price > 0))
    assert.ok(items.every((item) => /about (?:[1-9]|10) minutes/.test(item.description)))
    assert.ok(items.every((item) => /^https:\/\/images\.unsplash\.com\/photo-[\w-]+\?/.test(item.imageUrl)))
  }

  assert.equal(new Set(menuItems.map((item) => `${item.category}:${item.name}`)).size, 30)
  assert.equal(new Set(menuItems.map((item) => item.imageUrl)).size, 30)
})
