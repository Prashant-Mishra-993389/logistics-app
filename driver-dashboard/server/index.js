import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { dashboardData } from './dashboardData.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5000
const driverLocationStore = {
  latest: null,
  history: [],
}
const driverMessageStore = {
  latest: null,
  history: [],
}

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.get('/api/dashboard', (_req, res) => {
  res.json(dashboardData)
})

app.post('/api/driver-location', (req, res) => {
  const {
    shipmentId,
    loadId,
    driver,
    latitude,
    longitude,
    speedMph,
    recordedAt,
    source,
  } = req.body ?? {}

  const parsedLatitude = Number(latitude)
  const parsedLongitude = Number(longitude)

  if (!shipmentId || !driver || !Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
    res.status(400).json({
      ok: false,
      message: 'shipmentId, driver, latitude, and longitude are required.',
    })
    return
  }

  const parsedSpeed = Number(speedMph)
  const locationRecord = {
    id: `loc-${Date.now()}`,
    shipmentId,
    loadId: loadId ?? shipmentId,
    driver,
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    speedMph: Number.isFinite(parsedSpeed) ? Math.max(0, Math.round(parsedSpeed)) : 0,
    recordedAt: recordedAt ?? new Date().toISOString(),
    source: source ?? 'current-shipment',
    receivedAt: new Date().toISOString(),
  }

  driverLocationStore.latest = locationRecord
  driverLocationStore.history.unshift(locationRecord)
  if (driverLocationStore.history.length > 200) {
    driverLocationStore.history.pop()
  }

  res.json({
    ok: true,
    receivedAt: locationRecord.receivedAt,
    record: locationRecord,
  })
})

app.get('/api/driver-location/latest', (_req, res) => {
  res.json({
    ok: true,
    latest: driverLocationStore.latest,
    updatesCount: driverLocationStore.history.length,
  })
})

app.post('/api/driver-message', (req, res) => {
  const {
    shipmentId,
    loadId,
    driver,
    message,
    category,
    priority,
    sentAt,
  } = req.body ?? {}

  const cleanMessage = String(message ?? '').trim()
  if (!shipmentId || !driver || cleanMessage.length === 0) {
    res.status(400).json({
      ok: false,
      message: 'shipmentId, driver, and message are required.',
    })
    return
  }

  const payload = {
    id: `msg-${Date.now()}`,
    shipmentId,
    loadId: loadId ?? shipmentId,
    driver,
    message: cleanMessage,
    category: category ?? 'general',
    priority: priority ?? 'normal',
    sentAt: sentAt ?? new Date().toISOString(),
    receivedAt: new Date().toISOString(),
  }

  driverMessageStore.latest = payload
  driverMessageStore.history.unshift(payload)
  if (driverMessageStore.history.length > 100) {
    driverMessageStore.history.pop()
  }

  res.json({
    ok: true,
    receivedAt: payload.receivedAt,
    record: payload,
  })
})

app.get('/api/driver-message/latest', (_req, res) => {
  res.json({
    ok: true,
    latest: driverMessageStore.latest,
    totalMessages: driverMessageStore.history.length,
  })
})

app.listen(port, () => {
  console.log(`Dashboard API is running on http://localhost:${port}`)
})
