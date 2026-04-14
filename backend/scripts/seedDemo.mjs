import dotenv from 'dotenv'
import pg from 'pg'
import bcrypt from 'bcryptjs'

dotenv.config()

const { Pool } = pg

const databaseUrl = String(process.env.DATABASE_URL ?? '').trim()
if (!databaseUrl) {
  console.error('DATABASE_URL is missing. Add it to backend/.env before seeding demo data.')
  process.exit(1)
}

const shouldUseSsl = !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
})

const upsertUser = async ({ fullName, email, password, role }) => {
  const passwordHash = await bcrypt.hash(password, 10)

  const { rows } = await pool.query(
    `
    insert into users (full_name, email, password_hash, role)
    values ($1, $2, $3, $4)
    on conflict (email)
    do update set
      full_name = excluded.full_name,
      password_hash = excluded.password_hash,
      role = excluded.role
    returning id, full_name, email, role, created_at
    `,
    [fullName, email, passwordHash, role]
  )

  return rows[0]
}

const upsertShipment = async ({ loadCode, customerName, origin, destination, status, priority, assignedDriverId, createdBy }) => {
  const { rows } = await pool.query(
    `
    insert into shipments (load_code, customer_name, origin, destination, status, priority, assigned_driver_id, created_by)
    values ($1, $2, $3, $4, $5, $6, $7, $8)
    on conflict (load_code)
    do update set
      customer_name = excluded.customer_name,
      origin = excluded.origin,
      destination = excluded.destination,
      status = excluded.status,
      priority = excluded.priority,
      assigned_driver_id = excluded.assigned_driver_id,
      created_by = excluded.created_by,
      updated_at = now()
    returning id, load_code, customer_name, origin, destination, status, priority, assigned_driver_id, created_by, created_at, updated_at
    `,
    [loadCode, customerName, origin, destination, status, priority, assignedDriverId, createdBy]
  )

  return rows[0]
}

try {
  const admin = await upsertUser({
    fullName: 'Demo Admin',
    email: 'admin@logisticsdemo.com',
    password: 'admin123',
    role: 'admin',
  })

  const company = await upsertUser({
    fullName: 'Demo Company Manager',
    email: 'manager@logisticsdemo.com',
    password: 'manager123',
    role: 'company',
  })

  const driver = await upsertUser({
    fullName: 'Alex Rivera',
    email: 'driver1@logisticsdemo.com',
    password: 'driver123',
    role: 'driver',
  })

  const dispatcher = await upsertUser({
    fullName: 'Demo Dispatcher',
    email: 'dispatcher@logisticsdemo.com',
    password: 'dispatch123',
    role: 'dispatcher',
  })

  const shipmentA = await upsertShipment({
    loadCode: 'LOAD-2026-2209',
    customerName: 'TechHub Retail DC',
    origin: 'San Antonio, TX',
    destination: 'Austin, TX',
    status: 'in_transit',
    priority: 'high',
    assignedDriverId: driver.id,
    createdBy: company.id,
  })

  const shipmentB = await upsertShipment({
    loadCode: 'LOAD-2026-2210',
    customerName: 'Metro Wholesale Foods',
    origin: 'Dallas, TX',
    destination: 'Houston, TX',
    status: 'assigned',
    priority: 'medium',
    assignedDriverId: driver.id,
    createdBy: dispatcher.id,
  })

  await pool.query(
    `
    insert into driver_locations (shipment_id, driver_id, latitude, longitude, speed_mph, recorded_at)
    values
      ($1, $2, 30.2810, -97.7330, 42, now() - interval '20 minutes'),
      ($1, $2, 30.2741, -97.7419, 38, now() - interval '10 minutes'),
      ($1, $2, 30.2672, -97.7431, 35, now())
    `,
    [shipmentA.id, driver.id]
  )

  await pool.query(
    `
    insert into driver_messages (shipment_id, driver_id, category, priority, message, sent_at)
    values
      ($1, $2, 'delay', 'high', 'Minor traffic near checkpoint, ETA adjusted by 12 minutes.', now() - interval '9 minutes'),
      ($1, $2, 'dock', 'normal', 'Reached unloading dock and waiting for bay assignment.', now() - interval '2 minutes')
    `,
    [shipmentA.id, driver.id]
  )

  console.log('Demo users ready:')
  console.log('- admin@logisticsdemo.com / admin123')
  console.log('- manager@logisticsdemo.com / manager123')
  console.log('- driver1@logisticsdemo.com / driver123')
  console.log('- dispatcher@logisticsdemo.com / dispatch123')
  console.log('Demo shipments ready:')
  console.log(`- ${shipmentA.load_code}`)
  console.log(`- ${shipmentB.load_code}`)
} catch (error) {
  console.error('Seeding failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
