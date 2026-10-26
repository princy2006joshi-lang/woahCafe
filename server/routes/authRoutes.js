import { Router } from 'express'
import {
  getCurrentUser,
  login,
  logout,
  registerStudent,
  updateStudentProfile,
} from '../controllers/authController.js'
import requireAuth from '../middleware/requireAuth.js'
import requireDatabase from '../middleware/requireDatabase.js'
import requireRole from '../middleware/requireRole.js'

const router = Router()

router.post('/logout', logout)
router.use(requireDatabase)
router.post('/register', registerStudent)
router.post('/login', login)
router.get('/me', requireAuth, getCurrentUser)
router.patch('/profile', requireAuth, requireRole('student'), updateStudentProfile)

export default router
