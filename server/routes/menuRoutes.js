import { Router } from 'express'
import { listMenu } from '../controllers/menuController.js'
import requireDatabase from '../middleware/requireDatabase.js'

const router = Router()

router.use(requireDatabase)
router.get('/', listMenu)

export default router
