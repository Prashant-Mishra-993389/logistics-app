import { Router } from 'express'
import { db } from '../lib/db.js'
import { hashPassword, signAuthToken, verifyPassword } from '../lib/auth.js'
import { requireAuth } from '../middleware/requireAuth.js'

const authRoutes = Router()

const cleanText = (value) => String(value ?? '').trim()

const mapUser = (row) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  role: row.role,
  createdAt: row.created_at,
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

authRoutes.post('/auth/register', async (req, res, next) => {
  try {
    if (!assertDatabaseConfigured(res)) {
      return
    }

    const fullName = cleanText(req.body?.fullName)
    const email = cleanText(req.body?.email).toLowerCase()
    const password = cleanText(req.body?.password)
    const role = cleanText(req.body?.role || 'company').toLowerCase()

    const allowedRoles = ['admin', 'dispatcher', 'driver', 'company']

    if (!fullName || !email || !password) {
      res.status(400).json({
        ok: false,
        message: 'fullName, email, and password are required.',
      })
      return
    }

    if (!allowedRoles.includes(role)) {
      res.status(400).json({
        ok: false,
        message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`,
      })
      return
    }

    if (password.length < 6) {
      res.status(400).json({
        ok: false,
        message: 'Password must be at least 6 characters.',
      })
      return
    }

    const passwordHash = await hashPassword(password)

    const userRow = await db.one(
      `
      insert into users (full_name, email, password_hash, role)
      values ($1, $2, $3, $4)
      returning id, full_name, email, role, created_at
      `,
      [fullName, email, passwordHash, role]
    )

    const user = mapUser(userRow)
    const token = signAuthToken(user)

    res.status(201).json({
      ok: true,
      token,
      user,
    })
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({
        ok: false,
        message: 'Email already exists.',
      })
      return
    }

    next(error)
  }
})

authRoutes.post('/auth/login', async (req, res, next) => {
  try {
    if (!assertDatabaseConfigured(res)) {
      return
    }

    const email = cleanText(req.body?.email).toLowerCase()
    const password = cleanText(req.body?.password)

    if (!email || !password) {
      res.status(400).json({
        ok: false,
        message: 'email and password are required.',
      })
      return
    }

    const row = await db.one(
      `
      select id, full_name, email, role, password_hash, created_at
      from users
      where email = $1
      limit 1
      `,
      [email]
    )

    if (!row) {
      res.status(401).json({
        ok: false,
        message: 'Invalid credentials.',
      })
      return
    }

    const isValidPassword = await verifyPassword(password, row.password_hash)
    if (!isValidPassword) {
      res.status(401).json({
        ok: false,
        message: 'Invalid credentials.',
      })
      return
    }

    const user = mapUser(row)
    const token = signAuthToken(user)

    res.json({
      ok: true,
      token,
      user,
    })
  } catch (error) {
    next(error)
  }
})

authRoutes.get('/auth/me', requireAuth, async (req, res, next) => {
  try {
    if (!assertDatabaseConfigured(res)) {
      return
    }

    const row = await db.one(
      `
      select id, full_name, email, role, created_at
      from users
      where id = $1
      limit 1
      `,
      [req.user.id]
    )

    if (!row) {
      res.status(404).json({
        ok: false,
        message: 'User not found.',
      })
      return
    }

    res.json({
      ok: true,
      user: mapUser(row),
    })
  } catch (error) {
    next(error)
  }
})

export { authRoutes }
