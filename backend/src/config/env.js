import dotenv from 'dotenv'

dotenv.config()

const toNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toString = (value, fallback = '') => {
  const nextValue = String(value ?? '').trim()
  return nextValue.length > 0 ? nextValue : fallback
}

export const env = {
  port: toNumber(process.env.PORT, 5000),
  corsOrigin: toString(process.env.CORS_ORIGIN, '*'),
  nodeEnv: toString(process.env.NODE_ENV, 'development'),
  databaseUrl: toString(process.env.DATABASE_URL),
  jwtSecret: toString(process.env.JWT_SECRET, 'change-me-in-production'),
  jwtExpiresIn: toString(process.env.JWT_EXPIRES_IN, '7d'),
  supabaseUrl: toString(process.env.SUPABASE_URL),
  supabaseServiceRoleKey: toString(process.env.SUPABASE_SERVICE_ROLE_KEY),
  supabaseStorageBucket: toString(process.env.SUPABASE_STORAGE_BUCKET, 'shipment-documents'),
}
