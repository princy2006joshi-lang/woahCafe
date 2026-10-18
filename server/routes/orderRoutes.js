import { Router } from 'express'
import { getMyOrder, listMyOrders, placeOrder } from '../controllers/orderController.js'
import requireAuth from '../middleware/requireAuth.js'
import requireDatabase from '../middleware/requireDatabase.js'
import requireRole from '../middleware/requireRole.js'

const router = Router()

router.use(requireDatabase, requireAuth, requireRole('student'))
router.post('/', placeOrder)
router.get('/my', listMyOrders)
router.get('/:id', getMyOrder)

export default router
