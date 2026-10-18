import { Router } from 'express'
import { getCurrentUser, login, logout, registerStudent } from '../controllers/authController.js'
import requireAuth from '../middleware/requireAuth.js'
import requireDatabase from '../middleware/requireDatabase.js'

const router = Router()

router.post('/logout', logout)
router.use(requireDatabase)
router.post('/register', registerStudent)
router.post('/login', login)
router.get('/me', requireAuth, getCurrentUser)

export default router
