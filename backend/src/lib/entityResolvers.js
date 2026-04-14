import crypto from 'node:crypto'
import { db } from './db.js'
import { hashPassword } from './auth.js'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const cleanText = (value) => String(value ?? '').trim()

const cleanNameForEmail = (name) => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 36)

  return base || 'driver'
}

export const isUuid = (value) => UUID_REGEX.test(cleanText(value))

const mapShipmentRow = (row) => ({
  id: row.id,
  loadCode: row.load_code,
  customerName: row.customer_name,
  origin: row.origin,
  destination: row.destination,
  status: row.status,
  priority: row.priority,
  assignedDriverId: row.assigned_driver_id,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const findShipmentByIdentifier = async (shipmentIdentifier) => {
  if (!db.isConfigured) {
    return null
  }

  const identifier = cleanText(shipmentIdentifier)
  if (!identifier) {
    return null
  }

  const row = isUuid(identifier)
    ? await db.one(
        `
        select id, load_code, customer_name, origin, destination, status, priority, assigned_driver_id, created_by, created_at, updated_at
        from shipments
        where id = $1 or load_code = $1
        limit 1
        `,
        [identifier]
      )
    : await db.one(
        `
        select id, load_code, customer_name, origin, destination, status, priority, assigned_driver_id, created_by, created_at, updated_at
        from shipments
        where load_code = $1
        limit 1
        `,
        [identifier]
      )

  return row ? mapShipmentRow(row) : null
}

export const ensureShipmentByIdentifier = async (shipmentIdentifier, defaults = {}) => {
  if (!db.isConfigured) {
    return null
  }

  const identifier = cleanText(shipmentIdentifier)
  if (!identifier) {
    return null
  }

  const existing = await findShipmentByIdentifier(identifier)
  if (existing) {
    return existing
  }

  const createdByUserId = isUuid(defaults.createdByUserId) ? defaults.createdByUserId : null
  const loadCode = isUuid(identifier)
    ? `LOAD-${Date.now()}`
    : identifier

  try {
    const inserted = await db.one(
      `
      insert into shipments (load_code, customer_name, origin, destination, status, priority, created_by)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning id, load_code, customer_name, origin, destination, status, priority, assigned_driver_id, created_by, created_at, updated_at
      `,
      [
        loadCode,
        cleanText(defaults.customerName) || 'Unknown Customer',
        cleanText(defaults.origin) || 'Unknown Origin',
        cleanText(defaults.destination) || 'Unknown Destination',
        cleanText(defaults.status) || 'created',
        cleanText(defaults.priority) || 'medium',
        createdByUserId,
      ]
    )

    return mapShipmentRow(inserted)
  } catch (error) {
    if (error.code !== '23505') {
      throw error
    }

    return findShipmentByIdentifier(loadCode)
  }
}

export const findUserById = async (userId) => {
  if (!db.isConfigured || !isUuid(userId)) {
    return null
  }

  return db.one(
    'select id, full_name, email, role, created_at from users where id = $1 limit 1',
    [userId]
  )
}

export const ensureDriverByName = async (driverName) => {
  if (!db.isConfigured) {
    return null
  }

  const cleanDriverName = cleanText(driverName)
  if (!cleanDriverName) {
    return null
  }

  const existingDriver = await db.one(
    `
    select id, full_name
    from users
    where role = 'driver' and lower(full_name) = lower($1)
    limit 1
    `,
    [cleanDriverName]
  )

  if (existingDriver) {
    return existingDriver.id
  }

  const passwordHash = await hashPassword(crypto.randomBytes(16).toString('hex'))
  const email = `${cleanNameForEmail(cleanDriverName)}.${Date.now()}@driver.local`

  const insertedDriver = await db.one(
    `
    insert into users (full_name, email, password_hash, role)
    values ($1, $2, $3, 'driver')
    returning id
    `,
    [cleanDriverName, email, passwordHash]
  )

  return insertedDriver.id
}
