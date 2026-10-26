import assert from 'node:assert/strict'
import test from 'node:test'
import { validateStudentProfile } from './authController.js'

test('profile validation accepts name and phone updates and trims the values', () => {
  assert.deepEqual(validateStudentProfile({
    name: '  Alex Student  ',
    phone: '  +1 (555) 123-4567  ',
  }), {
    updates: {
      name: 'Alex Student',
      phone: '+1 (555) 123-4567',
    },
  })
})

test('profile validation accepts updates to one permitted field', () => {
  assert.deepEqual(validateStudentProfile({ name: 'Alex Student' }), {
    updates: { name: 'Alex Student' },
  })
})

test('profile validation rejects empty updates, invalid values, and protected fields', () => {
  assert.match(validateStudentProfile({}).error, /name and phone/)
  assert.match(validateStudentProfile({ name: ' ' }).error, /Name is required/)
  assert.match(validateStudentProfile({ name: 'A'.repeat(101) }).error, /100 characters/)
  assert.match(validateStudentProfile({ phone: 'not a phone' }).error, /valid phone/)
  assert.match(validateStudentProfile({ email: 'attacker@example.com' }).error, /Only your name and phone/)
  assert.match(validateStudentProfile({ role: 'kitchen' }).error, /Only your name and phone/)
  assert.match(validateStudentProfile(null).error, /profile details/)
})
