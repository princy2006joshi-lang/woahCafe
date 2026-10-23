import { Router } from 'express'
import { listKitchenOrders, updateOrderStatus } from '../controllers/kitchenController.js'
import { createMenuItem, deleteMenuItem, listKitchenMenu, updateMenuItem } from '../controllers/menuController.js'
import requireAuth from '../middleware/requireAuth.js'
import requireDatabase from '../middleware/requireDatabase.js'
import requireRole from '../middleware/requireRole.js'

const router = Router()

router.use(requireDatabase, requireAuth, requireRole('kitchen'))
router.get('/orders', listKitchenOrders)
router.patch('/orders/:id/status', updateOrderStatus)
router.get('/menu', listKitchenMenu)
router.post('/menu', createMenuItem)
router.patch('/menu/:id', updateMenuItem)
router.delete('/menu/:id', deleteMenuItem)

export default router
