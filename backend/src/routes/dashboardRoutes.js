import { Router } from 'express'
import { dashboardData } from '../data/dashboardData.js'

const dashboardRoutes = Router()

dashboardRoutes.get('/dashboard', (_req, res) => {
  res.json(dashboardData)
})

export { dashboardRoutes }
