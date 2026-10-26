import { Router } from 'express'
import {
  createPaymentAttempt,
  getMyOrder,
  listMyOrders,
  placeOrder,
  recordRazorpayFailure,
  verifyPayment,
} from '../controllers/orderController.js'
import requireAuth from '../middleware/requireAuth.js'
import requireDatabase from '../middleware/requireDatabase.js'
import requireRole from '../middleware/requireRole.js'

const router = Router()

router.use(requireDatabase, requireAuth, requireRole('student'))
router.post('/', placeOrder)
router.get('/my', listMyOrders)
router.post('/:id/payments/attempt', createPaymentAttempt)
router.post('/:id/payments/verify', verifyPayment)
router.post('/:id/payments/failure', recordRazorpayFailure)
router.get('/:id', getMyOrder)

export default router
