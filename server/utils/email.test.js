import test from 'node:test'
import assert from 'node:assert/strict'
import { isInstitutionalEmail } from './email.js'
import User from '../models/User.js'
import { registerStudent } from '../controllers/authController.js'

test('institutional email validation accepts only the exact domain', () => {
  assert.equal(isInstitutionalEmail('student@sst.scaler.com'), true)
  assert.equal(isInstitutionalEmail('Student@SST.SCALER.COM'), true)
  assert.equal(isInstitutionalEmail('student+tag@sst.scaler.com'), true)
  assert.equal(isInstitutionalEmail('student@example.com'), false)
  assert.equal(isInstitutionalEmail('student@sst.scaler.com.example.org'), false)
  assert.equal(isInstitutionalEmail('student@sub.sst.scaler.com'), false)
  assert.equal(isInstitutionalEmail('student@not-sst.scaler.com'), false)
  assert.equal(isInstitutionalEmail(''), false)
})

test('user model applies the institutional domain rule to student accounts only', () => {
  const student = new User({
    name: 'Student',
    email: 'student@example.com',
    passwordHash: 'hashed',
    role: 'student',
  })
  const eligibleStudent = new User({
    name: 'Student',
    email: 'student@sst.scaler.com',
    passwordHash: 'hashed',
    role: 'student',
  })
  const kitchen = new User({
    name: 'Kitchen',
    email: 'kitchen@example.com',
    passwordHash: 'hashed',
    role: 'kitchen',
  })

  assert.equal(student.validateSync().errors.email.message, 'Student accounts must use an @sst.scaler.com email address.')
  assert.equal(eligibleStudent.validateSync(), undefined)
  assert.equal(kitchen.validateSync(), undefined)
})

test('student registration rejects non-institutional email addresses', async () => {
  const response = {
    statusCode: 200,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    },
  }

  await registerStudent({
    body: {
      name: 'Student',
      email: 'student@example.com',
      password: 'password123',
      phone: '1234567890',
    },
  }, response)

  assert.equal(response.statusCode, 403)
  assert.equal(response.body.message, 'Use your @sst.scaler.com email address.')
})
