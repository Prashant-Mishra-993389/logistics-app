import dotenv from 'dotenv'

dotenv.config()

const toPort = (value, fallback) => {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return fallback
  }

  const parsed = Number.parseInt(raw, 10)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return fallback
  }

  return parsed
}

const toString = (value, fallback = '') => {
  const nextValue = String(value ?? '').trim()
  return nextValue.length > 0 ? nextValue : fallback
}

export const env = {
  port: toPort(process.env.PORT, 5000),
  corsOrigin: toString(process.env.CORS_ORIGIN, '*'),
  nodeEnv: toString(process.env.NODE_ENV, 'development'),
  databaseUrl: toString(process.env.DATABASE_URL),
  jwtSecret: toString(process.env.JWT_SECRET, 'change-me-in-production'),
  jwtExpiresIn: toString(process.env.JWT_EXPIRES_IN, '7d'),
  supabaseUrl: toString(process.env.SUPABASE_URL),
  supabaseServiceRoleKey: toString(process.env.SUPABASE_SERVICE_ROLE_KEY),
  supabaseStorageBucket: toString(process.env.SUPABASE_STORAGE_BUCKET, 'shipment-documents'),
}
