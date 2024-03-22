import expres from 'express'
import { propiedades } from '../controllers/apiController.js'

const router = expres.Router()

router.get('/propiedades', propiedades)

export default router