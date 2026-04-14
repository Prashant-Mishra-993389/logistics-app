import pg from 'pg'
import { env } from '../config/env.js'

const { Pool } = pg

const shouldUseSsl = Boolean(
  env.databaseUrl
  && !env.databaseUrl.includes('localhost')
  && !env.databaseUrl.includes('127.0.0.1')
)

const pool = env.databaseUrl
  ? new Pool({
      connectionString: env.databaseUrl,
      ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
    })
  : null

const query = async (text, params = []) => {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured.')
  }

  return pool.query(text, params)
}

const one = async (text, params = []) => {
  const result = await query(text, params)
  return result.rows[0] ?? null
}

const many = async (text, params = []) => {
  const result = await query(text, params)
  return result.rows
}

const close = async () => {
  if (!pool) {
    return
  }

  await pool.end()
}

export const db = {
  isConfigured: Boolean(pool),
  query,
  one,
  many,
  close,
}
