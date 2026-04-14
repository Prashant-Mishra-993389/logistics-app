import { Router } from 'express'
import { db } from '../lib/db.js'
import {
  ensureDriverByName,
  ensureShipmentByIdentifier,
  findShipmentByIdentifier,
  isUuid,
} from '../lib/entityResolvers.js'
import { attachUserIfPresent } from '../middleware/requireAuth.js'

const shipmentRoutes = Router()

shipmentRoutes.use(attachUserIfPresent)

const ALLOWED_STATUSES = ['created', 'assigned', 'loading', 'in_transit', 'delivered', 'cancelled']
const ALLOWED_PRIORITIES = ['low', 'medium', 'high']

const cleanText = (value) => String(value ?? '').trim()

const mapShipmentRow = (row) => ({
  id: row.id,
  loadCode: row.load_code,
  customerName: row.customer_name,
  origin: row.origin,
  destination: row.destination,
  status: row.status,
  priority: row.priority,
  assignedDriverId: row.assigned_driver_id,
  assignedDriverName: row.assigned_driver_name ?? null,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const assertDatabaseConfigured = (res) => {
  if (db.isConfigured) {
    return true
  }

  res.status(500).json({
    ok: false,
    message: 'Database is not configured. Set DATABASE_URL in backend .env.',
  })
  return false
}

shipmentRoutes.get('/shipments', async (req, res, next) => {
  try {
    if (!assertDatabaseConfigured(res)) {
      return
    }

    const status = cleanText(req.query.status).toLowerCase()
    const parsedLimit = Number(req.query.limit)
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(200, Math.round(parsedLimit))) : 50

    const params = []
    const whereClause = []

    if (status) {
      params.push(status)
      whereClause.push(`s.status = $${params.length}`)
    }

    params.push(limit)
    const limitParamIndex = params.length

    let sql = `
      select
        s.id,
        s.load_code,
        s.customer_name,
        s.origin,
        s.destination,
        s.status,
        s.priority,
        s.assigned_driver_id,
        s.created_by,
        s.created_at,
        s.updated_at,
        u.full_name as assigned_driver_name
      from shipments s
      left join users u on u.id = s.assigned_driver_id
    `

    if (whereClause.length > 0) {
      sql += ` where ${whereClause.join(' and ')}`
    }

    sql += ` order by s.created_at desc limit $${limitParamIndex}`

    const rows = await db.many(sql, params)

    res.json({
      ok: true,
      shipments: rows.map(mapShipmentRow),
      total: rows.length,
    })
  } catch (error) {
    next(error)
  }
})

shipmentRoutes.post('/shipments', async (req, res, next) => {
  try {
    if (!assertDatabaseConfigured(res)) {
      return
    }

    const loadCode = cleanText(req.body?.loadCode) || `LOAD-${Date.now()}`
    const customerName = cleanText(req.body?.customerName)
    const origin = cleanText(req.body?.origin)
    const destination = cleanText(req.body?.destination)
    const status = cleanText(req.body?.status || 'created').toLowerCase()
    const priority = cleanText(req.body?.priority || 'medium').toLowerCase()

    if (!customerName || !origin || !destination) {
      res.status(400).json({
        ok: false,
        message: 'customerName, origin, and destination are required.',
      })
      return
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({
        ok: false,
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      })
      return
    }

    if (!ALLOWED_PRIORITIES.includes(priority)) {
      res.status(400).json({
        ok: false,
        message: `Invalid priority. Allowed values: ${ALLOWED_PRIORITIES.join(', ')}`,
      })
      return
    }

    const createdByFromBody = cleanText(req.body?.createdByUserId)
    const createdBy = isUuid(req.user?.id)
      ? req.user.id
      : (isUuid(createdByFromBody) ? createdByFromBody : null)

    const row = await db.one(
      `
      insert into shipments (load_code, customer_name, origin, destination, status, priority, created_by)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning id, load_code, customer_name, origin, destination, status, priority, assigned_driver_id, created_by, created_at, updated_at
      `,
      [loadCode, customerName, origin, destination, status, priority, createdBy]
    )

    res.status(201).json({
      ok: true,
      shipment: mapShipmentRow(row),
    })
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({
        ok: false,
        message: 'loadCode already exists. Use a unique load code.',
      })
      return
    }

    next(error)
  }
})

shipmentRoutes.get('/shipments/:shipmentIdentifier', async (req, res, next) => {
  try {
    if (!assertDatabaseConfigured(res)) {
      return
    }

    const shipment = await findShipmentByIdentifier(req.params.shipmentIdentifier)

    if (!shipment) {
      res.status(404).json({
        ok: false,
        message: 'Shipment not found.',
      })
      return
    }

    const row = await db.one(
      `
      select
        s.id,
        s.load_code,
        s.customer_name,
        s.origin,
        s.destination,
        s.status,
        s.priority,
        s.assigned_driver_id,
        s.created_by,
        s.created_at,
        s.updated_at,
        u.full_name as assigned_driver_name
      from shipments s
      left join users u on u.id = s.assigned_driver_id
      where s.id = $1
      limit 1
      `,
      [shipment.id]
    )

    res.json({
      ok: true,
      shipment: mapShipmentRow(row),
    })
  } catch (error) {
    next(error)
  }
})

shipmentRoutes.patch('/shipments/:shipmentIdentifier/status', async (req, res, next) => {
  try {
    if (!assertDatabaseConfigured(res)) {
      return
    }

    const status = cleanText(req.body?.status).toLowerCase()
    if (!ALLOWED_STATUSES.includes(status)) {
      res.status(400).json({
        ok: false,
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`,
      })
      return
    }

    const shipment = await findShipmentByIdentifier(req.params.shipmentIdentifier)
    if (!shipment) {
      res.status(404).json({
        ok: false,
        message: 'Shipment not found.',
      })
      return
    }

    const row = await db.one(
      `
      update shipments
      set status = $2, updated_at = now()
      where id = $1
      returning id, load_code, customer_name, origin, destination, status, priority, assigned_driver_id, created_by, created_at, updated_at
      `,
      [shipment.id, status]
    )

    res.json({
      ok: true,
      shipment: mapShipmentRow(row),
    })
  } catch (error) {
    next(error)
  }
})

shipmentRoutes.post('/shipments/:shipmentIdentifier/assign-driver', async (req, res, next) => {
  try {
    if (!assertDatabaseConfigured(res)) {
      return
    }

    const shipment = await ensureShipmentByIdentifier(req.params.shipmentIdentifier)
    if (!shipment) {
      res.status(404).json({
        ok: false,
        message: 'Shipment not found and could not be created.',
      })
      return
    }

    const driverIdFromBody = cleanText(req.body?.driverId)
    const driverNameFromBody = cleanText(req.body?.driverName)

    let driverId = isUuid(driverIdFromBody) ? driverIdFromBody : null

    if (!driverId && driverNameFromBody) {
      driverId = await ensureDriverByName(driverNameFromBody)
    }

    if (!driverId) {
      res.status(400).json({
        ok: false,
        message: 'driverId or driverName is required.',
      })
      return
    }

    const row = await db.one(
      `
      update shipments
      set assigned_driver_id = $2,
          status = case when status = 'created' then 'assigned' else status end,
          updated_at = now()
      where id = $1
      returning id, load_code, customer_name, origin, destination, status, priority, assigned_driver_id, created_by, created_at, updated_at
      `,
      [shipment.id, driverId]
    )

    const driver = await db.one(
      'select id, full_name, email, role, created_at from users where id = $1 limit 1',
      [driverId]
    )

    res.json({
      ok: true,
      shipment: {
        ...mapShipmentRow(row),
        assignedDriverName: driver?.full_name ?? null,
      },
      driver: driver
        ? {
            id: driver.id,
            fullName: driver.full_name,
            email: driver.email,
            role: driver.role,
            createdAt: driver.created_at,
          }
        : null,
    })
  } catch (error) {
    next(error)
  }
})

shipmentRoutes.get('/shipments/:shipmentIdentifier/timeline', async (req, res, next) => {
  try {
    if (!assertDatabaseConfigured(res)) {
      return
    }

    const shipment = await findShipmentByIdentifier(req.params.shipmentIdentifier)
    if (!shipment) {
      res.status(404).json({
        ok: false,
        message: 'Shipment not found.',
      })
      return
    }

    const parsedLimit = Number(req.query.limit)
    const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(100, Math.round(parsedLimit))) : 25

    const [locationRows, messageRows] = await Promise.all([
      db.many(
        `
        select dl.id, dl.latitude, dl.longitude, dl.speed_mph, dl.recorded_at, coalesce(u.full_name, 'Unknown Driver') as driver_name
        from driver_locations dl
        left join users u on u.id = dl.driver_id
        where dl.shipment_id = $1
        order by dl.recorded_at desc, dl.id desc
        limit $2
        `,
        [shipment.id, limit]
      ),
      db.many(
        `
        select dm.id, dm.message, dm.category, dm.priority, dm.sent_at, coalesce(u.full_name, 'Unknown Driver') as driver_name
        from driver_messages dm
        left join users u on u.id = dm.driver_id
        where dm.shipment_id = $1
        order by dm.sent_at desc, dm.id desc
        limit $2
        `,
        [shipment.id, limit]
      ),
    ])

    res.json({
      ok: true,
      shipment,
      locations: locationRows.map((row) => ({
        id: `loc-${row.id}`,
        shipmentId: shipment.loadCode,
        driver: row.driver_name,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        speedMph: Number(row.speed_mph),
        recordedAt: row.recorded_at,
      })),
      messages: messageRows.map((row) => ({
        id: `msg-${row.id}`,
        shipmentId: shipment.loadCode,
        driver: row.driver_name,
        message: row.message,
        category: row.category,
        priority: row.priority,
        sentAt: row.sent_at,
      })),
    })
  } catch (error) {
    next(error)
  }
})

export { shipmentRoutes }
