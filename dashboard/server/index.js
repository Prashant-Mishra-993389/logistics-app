import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { dashboardData } from './dashboardData.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.get('/api/dashboard', (_req, res) => {
  res.json(dashboardData)
})

app.listen(port, () => {
  console.log(`Dashboard API is running on http://localhost:${port}`)
})
