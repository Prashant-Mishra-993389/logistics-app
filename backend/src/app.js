import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { env } from './config/env.js'
import { authRoutes } from './routes/authRoutes.js'
import { dashboardRoutes } from './routes/dashboardRoutes.js'
import { documentRoutes } from './routes/documentRoutes.js'
import { shipmentRoutes } from './routes/shipmentRoutes.js'
import { healthRoutes } from './routes/healthRoutes.js'
import { driverTelemetryRoutes } from './routes/driverTelemetryRoutes.js'
import { settingsRoutes } from './routes/settingsRoutes.js'

const app = express()

const corsMiddleware = env.corsOrigin === '*'
  ? cors()
  : cors({ origin: env.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean) })

app.use(corsMiddleware)
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

app.use('/api', healthRoutes)
app.use('/api', dashboardRoutes)
app.use('/api', authRoutes)
app.use('/api', shipmentRoutes)
app.use('/api', documentRoutes)
app.use('/api', driverTelemetryRoutes)
app.use('/api', settingsRoutes)

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    message: 'Route not found',
  })
})

app.use((error, _req, res, _next) => {
  console.error('[api-error]', error)
  res.status(500).json({
    ok: false,
    message: 'Internal server error',
  })
})

export { app }
