import { Router } from 'express'
import { db } from '../lib/db.js'
import { isStorageConfigured } from '../lib/supabase.js'

const healthRoutes = Router()

healthRoutes.get('/health', async (_req, res) => {
  let database = 'not-configured'

  if (db.isConfigured) {
    try {
      await db.query('select 1 as ok')
      database = 'up'
    } catch {
      database = 'down'
    }
  }

  res.json({
    ok: database !== 'down',
    timestamp: new Date().toISOString(),
    services: {
      database,
      storage: isStorageConfigured ? 'configured' : 'not-configured',
    },
  })
})

export { healthRoutes }
