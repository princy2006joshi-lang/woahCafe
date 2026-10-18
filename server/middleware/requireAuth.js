import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export default async function requireAuth(request, response, next) {
  const token = request.cookies.woahCafeToken
  if (!token) {
    return response.status(401).json({ message: 'Please log in to continue.' })
  }

  if (!process.env.JWT_SECRET) {
    return response.status(500).json({ message: 'Authentication is not configured.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) {
      return response.status(401).json({ message: 'Please log in to continue.' })
    }

    request.user = user
    return next()
  } catch {
    return response.status(401).json({ message: 'Your session has expired. Please log in again.' })
  }
}
