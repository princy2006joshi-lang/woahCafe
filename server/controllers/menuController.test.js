import test from 'node:test'
import assert from 'node:assert/strict'
import { validateMenuFields } from './menuController.js'
import MenuItem from '../models/MenuItem.js'

test('menu item validation accepts complete valid items with optional fields', () => {
  assert.equal(validateMenuFields({
    name: 'Masala chai',
    category: 'Drinks',
    price: 25,
    description: '',
    imageUrl: 'https://example.com/chai.jpg',
    available: true,
  }, true), null)
})

test('menu item validation requires name, price, and category on creation', () => {
  assert.equal(validateMenuFields({ name: 'Chai', price: 25 }, true), 'Name, price, and category are required.')
})

test('menu item validation rejects invalid field values and unknown fields', () => {
  assert.match(validateMenuFields({ price: '25' }, false), /Price must be a number/)
  assert.match(validateMenuFields({ available: 'false' }, false), /Availability must be true or false/)
  assert.match(validateMenuFields({ name: ' '.repeat(2) }, false), /Name is required/)
  assert.match(validateMenuFields({ imageUrl: 'javascript:alert(1)' }, false), /HTTP or HTTPS/)
  assert.match(validateMenuFields({ role: 'kitchen' }, false), /valid menu item fields/)
})

test('menu item model rejects non-HTTP image URLs', () => {
  const invalidImage = new MenuItem({
    name: 'Coffee',
    category: 'Drinks',
    price: 20,
    imageUrl: 'data:image/png;base64,AAAA',
  })
  const validImage = new MenuItem({
    name: 'Coffee',
    category: 'Drinks',
    price: 20,
    imageUrl: 'https://example.com/coffee.png',
  })

  assert.match(invalidImage.validateSync().errors.imageUrl.message, /HTTP or HTTPS/)
  assert.equal(validImage.validateSync(), undefined)
})
