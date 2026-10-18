import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  }
}

function setLoginCookie(response, user) {
  if (!process.env.JWT_SECRET) {
    const error = new Error('Authentication is not configured. Set JWT_SECRET in server/.env.')
    error.statusCode = 503
    throw error
  }

  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' })
  response.cookie('woahCafeToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export async function registerStudent(request, response) {
  const { name, email, password, phone } = request.body
  if (![name, email, password, phone].every((value) => typeof value === 'string' && value.trim())) {
    return response.status(400).json({ message: 'Name, email, password, and phone are required.' })
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return response.status(400).json({ message: 'Enter a valid email address.' })
  }
  if (password.length < 8) {
    return response.status(400).json({ message: 'Password must be at least 8 characters.' })
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return response.status(400).json({ message: 'Password must be no more than 72 UTF-8 bytes.' })
  }
  if (!/^\+?[\d\s().-]{7,30}$/.test(phone.trim())) {
    return response.status(400).json({ message: 'Enter a valid phone number.' })
  }

  const existingUser = await User.findOne({ email: normalizedEmail })
  if (existingUser) {
    return response.status(409).json({ message: 'An account with that email already exists.' })
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    phone: phone.trim(),
    role: 'student',
  })

  setLoginCookie(response, user)
  return response.status(201).json({ user: publicUser(user) })
}

export async function login(request, response) {
  const email = typeof request.body.email === 'string' ? request.body.email.trim().toLowerCase() : ''
  const password = typeof request.body.password === 'string' ? request.body.password : ''
  if (!email || !password) {
    return response.status(400).json({ message: 'Email and password are required.' })
  }

  const user = await User.findOne({ email }).select('+passwordHash')
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return response.status(401).json({ message: 'Email or password is incorrect.' })
  }

  setLoginCookie(response, user)
  return response.json({ user: publicUser(user) })
}

export async function logout(request, response) {
  response.clearCookie('woahCafeToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })
  return response.json({ message: 'Logged out.' })
}

export async function getCurrentUser(request, response) {
  return response.json({ user: publicUser(request.user) })
}
