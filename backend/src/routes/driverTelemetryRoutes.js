import { Router } from 'express'
import { db } from '../lib/db.js'
import {
  ensureDriverByName,
  ensureShipmentByIdentifier,
} from '../lib/entityResolvers.js'
import {
  getDriverLocationState,
  getDriverMessageState,
  pushDriverLocation,
  pushDriverMessage,
} from '../lib/runtimeStore.js'

const driverTelemetryRoutes = Router()

const toFiniteNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toIsoTimestamp = (value) => {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

const readLocationStateFromDatabase = async (limit = 25) => {
  if (!db.isConfigured) {
    return null
  }

  try {
    const rows = await db.many(
      `
      select
        dl.id,
        dl.latitude,
        dl.longitude,
        dl.speed_mph,
        dl.recorded_at,
        coalesce(s.load_code, dl.shipment_id::text) as shipment_ref,
        coalesce(u.full_name, 'Unknown Driver') as driver_name
      from driver_locations dl
      left join shipments s on s.id = dl.shipment_id
      left join users u on u.id = dl.driver_id
      order by dl.recorded_at desc, dl.id desc
      limit $1
      `,
      [limit]
    )

    const countRow = await db.one('select count(*)::int as total from driver_locations')

    const history = rows.map((row) => ({
      id: `loc-${row.id}`,
      shipmentId: row.shipment_ref,
      loadId: row.shipment_ref,
      driver: row.driver_name,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      speedMph: Number(row.speed_mph),
      recordedAt: row.recorded_at,
      source: 'postgres',
      receivedAt: row.recorded_at,
    }))

    return {
      latest: history[0] ?? null,
      history,
      total: Number(countRow?.total ?? history.length),
    }
  } catch (error) {
    console.warn('[driver-location] Falling back to runtime store:', error.message)
    return null
  }
}

const readMessageStateFromDatabase = async (limit = 25) => {
  if (!db.isConfigured) {
    return null
  }

  try {
    const rows = await db.many(
      `
      select
        dm.id,
        dm.message,
        dm.category,
        dm.priority,
        dm.sent_at,
        coalesce(s.load_code, dm.shipment_id::text) as shipment_ref,
        coalesce(u.full_name, 'Unknown Driver') as driver_name
      from driver_messages dm
      left join shipments s on s.id = dm.shipment_id
      left join users u on u.id = dm.driver_id
      order by dm.sent_at desc, dm.id desc
      limit $1
      `,
      [limit]
    )

    const countRow = await db.one('select count(*)::int as total from driver_messages')

    const history = rows.map((row) => ({
      id: `msg-${row.id}`,
      shipmentId: row.shipment_ref,
      loadId: row.shipment_ref,
      driver: row.driver_name,
      message: row.message,
      category: row.category,
      priority: row.priority,
      sentAt: row.sent_at,
      receivedAt: row.sent_at,
    }))

    return {
      latest: history[0] ?? null,
      history,
      total: Number(countRow?.total ?? history.length),
    }
  } catch (error) {
    console.warn('[driver-message] Falling back to runtime store:', error.message)
    return null
  }
}

driverTelemetryRoutes.post('/driver-location', async (req, res, next) => {
  try {
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

    const parsedLatitude = toFiniteNumber(latitude)
    const parsedLongitude = toFiniteNumber(longitude)

    if (!shipmentId || !driver || parsedLatitude === null || parsedLongitude === null) {
      res.status(400).json({
        ok: false,
        message: 'shipmentId, driver, latitude, and longitude are required.',
      })
      return
    }

    const parsedSpeed = toFiniteNumber(speedMph)
    const record = {
      id: `loc-${Date.now()}`,
      shipmentId: String(shipmentId),
      loadId: loadId ? String(loadId) : String(shipmentId),
      driver: String(driver),
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      speedMph: parsedSpeed === null ? 0 : Math.max(0, Math.round(parsedSpeed)),
      recordedAt: toIsoTimestamp(recordedAt),
      source: source ? String(source) : 'current-shipment',
      receivedAt: new Date().toISOString(),
    }

    const state = await pushDriverLocation(record)

    if (db.isConfigured) {
      try {
        const shipment = await ensureShipmentByIdentifier(record.shipmentId, {
          status: 'in_transit',
        })
        const driverId = await ensureDriverByName(record.driver)

        if (shipment?.id) {
          await db.query(
            `
            insert into driver_locations (shipment_id, driver_id, latitude, longitude, speed_mph, recorded_at)
            values ($1, $2, $3, $4, $5, $6)
            `,
            [
              shipment.id,
              driverId,
              record.latitude,
              record.longitude,
              record.speedMph,
              record.recordedAt,
            ]
          )
        }
      } catch (error) {
        console.warn('[driver-location] Failed to write to Postgres:', error.message)
      }
    }

    const dbState = await readLocationStateFromDatabase(1)

    res.json({
      ok: true,
      receivedAt: record.receivedAt,
      record,
      updatesCount: dbState?.total ?? state.history.length,
    })
  } catch (error) {
    next(error)
  }
})

driverTelemetryRoutes.get('/driver-location/latest', async (_req, res, next) => {
  try {
    const dbState = await readLocationStateFromDatabase(1)
    if (dbState) {
      res.json({
        ok: true,
        latest: dbState.latest,
        updatesCount: dbState.total,
      })
      return
    }

    const state = await getDriverLocationState()
    res.json({
      ok: true,
      latest: state.latest,
      updatesCount: state.history.length,
    })
  } catch (error) {
    next(error)
  }
})

driverTelemetryRoutes.get('/driver-location/history', async (req, res, next) => {
  try {
    const parsedLimit = Number(req.query.limit)
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(200, Math.round(parsedLimit)))
      : 25

    const dbState = await readLocationStateFromDatabase(safeLimit)
    if (dbState) {
      res.json({
        ok: true,
        history: dbState.history,
        total: dbState.total,
      })
      return
    }

    const state = await getDriverLocationState()

    res.json({
      ok: true,
      history: state.history.slice(0, safeLimit),
      total: state.history.length,
    })
  } catch (error) {
    next(error)
  }
})

driverTelemetryRoutes.post('/driver-message', async (req, res, next) => {
  try {
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

    const record = {
      id: `msg-${Date.now()}`,
      shipmentId: String(shipmentId),
      loadId: loadId ? String(loadId) : String(shipmentId),
      driver: String(driver),
      message: cleanMessage,
      category: category ? String(category) : 'general',
      priority: priority ? String(priority) : 'normal',
      sentAt: toIsoTimestamp(sentAt),
      receivedAt: new Date().toISOString(),
    }

    const state = await pushDriverMessage(record)

    if (db.isConfigured) {
      try {
        const shipment = await ensureShipmentByIdentifier(record.shipmentId, {
          status: 'in_transit',
        })
        const driverId = await ensureDriverByName(record.driver)

        if (shipment?.id) {
          await db.query(
            `
            insert into driver_messages (shipment_id, driver_id, category, priority, message, sent_at)
            values ($1, $2, $3, $4, $5, $6)
            `,
            [
              shipment.id,
              driverId,
              record.category,
              record.priority,
              record.message,
              record.sentAt,
            ]
          )
        }
      } catch (error) {
        console.warn('[driver-message] Failed to write to Postgres:', error.message)
      }
    }

    const dbState = await readMessageStateFromDatabase(1)

    res.json({
      ok: true,
      receivedAt: record.receivedAt,
      record,
      totalMessages: dbState?.total ?? state.history.length,
    })
  } catch (error) {
    next(error)
  }
})

driverTelemetryRoutes.get('/driver-message/latest', async (_req, res, next) => {
  try {
    const dbState = await readMessageStateFromDatabase(1)
    if (dbState) {
      res.json({
        ok: true,
        latest: dbState.latest,
        totalMessages: dbState.total,
      })
      return
    }

    const state = await getDriverMessageState()

    res.json({
      ok: true,
      latest: state.latest,
      totalMessages: state.history.length,
    })
  } catch (error) {
    next(error)
  }
})

driverTelemetryRoutes.get('/driver-message/history', async (req, res, next) => {
  try {
    const parsedLimit = Number(req.query.limit)
    const safeLimit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(100, Math.round(parsedLimit)))
      : 25

    const dbState = await readMessageStateFromDatabase(safeLimit)
    if (dbState) {
      res.json({
        ok: true,
        history: dbState.history,
        total: dbState.total,
      })
      return
    }

    const state = await getDriverMessageState()

    res.json({
      ok: true,
      history: state.history.slice(0, safeLimit),
      total: state.history.length,
    })
  } catch (error) {
    next(error)
  }
})

export { driverTelemetryRoutes }
