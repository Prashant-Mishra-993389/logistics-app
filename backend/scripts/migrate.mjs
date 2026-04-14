import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const databaseUrl = String(process.env.DATABASE_URL ?? '').trim()
if (!databaseUrl) {
  console.error('DATABASE_URL is missing. Add it to backend/.env before running migrations.')
  process.exit(1)
}

const shouldUseSsl = !databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
})

const migrationFilePath = path.resolve(__dirname, '../sql/001_init.sql')

try {
  const sql = await readFile(migrationFilePath, 'utf8')
  await pool.query(sql)
  console.log('Migration completed successfully: sql/001_init.sql')
} catch (error) {
  console.error('Migration failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
