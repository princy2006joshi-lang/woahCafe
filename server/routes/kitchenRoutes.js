import { Router } from 'express'
import { listKitchenOrders, updateOrderStatus } from '../controllers/kitchenController.js'
import { createMenuItem, deleteMenuItem, updateMenuAvailability } from '../controllers/menuController.js'
import requireAuth from '../middleware/requireAuth.js'
import requireDatabase from '../middleware/requireDatabase.js'
import requireRole from '../middleware/requireRole.js'

const router = Router()

router.use(requireDatabase, requireAuth, requireRole('kitchen'))
router.get('/orders', listKitchenOrders)
router.patch('/orders/:id/status', updateOrderStatus)
router.post('/menu', createMenuItem)
router.patch('/menu/:id', updateMenuAvailability)
router.delete('/menu/:id', deleteMenuItem)

export default router
