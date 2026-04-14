import { Router } from 'express'
import { db } from '../lib/db.js'

const settingsRoutes = Router()

const runtimeFallbackStore = new Map()

const cleanScope = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized || 'global'
}

const ensureSettingsTable = async () => {
  if (!db.isConfigured) {
    return
  }

  await db.query(
    `
    create table if not exists app_settings (
      scope text primary key,
      payload jsonb not null default '{}'::jsonb,
      updated_at timestamptz not null default now()
    )
    `
  )
}

settingsRoutes.get('/settings', async (req, res, next) => {
  try {
    const scope = cleanScope(req.query.scope)

    if (!db.isConfigured) {
      res.json({
        ok: true,
        scope,
        payload: runtimeFallbackStore.get(scope) ?? {},
        source: 'memory',
      })
      return
    }

    await ensureSettingsTable()

    const row = await db.one(
      `
      select scope, payload, updated_at
      from app_settings
      where scope = $1
      limit 1
      `,
      [scope]
    )

    res.json({
      ok: true,
      scope,
      payload: row?.payload ?? {},
      updatedAt: row?.updated_at ?? null,
      source: 'postgres',
    })
  } catch (error) {
    next(error)
  }
})

settingsRoutes.put('/settings', async (req, res, next) => {
  try {
    const scope = cleanScope(req.body?.scope)
    const payload = req.body?.payload

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      res.status(400).json({
        ok: false,
        message: 'payload must be a JSON object.',
      })
      return
    }

    if (!db.isConfigured) {
      runtimeFallbackStore.set(scope, payload)
      res.json({
        ok: true,
        scope,
        payload,
        source: 'memory',
      })
      return
    }

    await ensureSettingsTable()

    const row = await db.one(
      `
      insert into app_settings (scope, payload, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (scope)
      do update set payload = excluded.payload, updated_at = now()
      returning scope, payload, updated_at
      `,
      [scope, JSON.stringify(payload)]
    )

    res.json({
      ok: true,
      scope: row.scope,
      payload: row.payload,
      updatedAt: row.updated_at,
      source: 'postgres',
    })
  } catch (error) {
    next(error)
  }
})

export { settingsRoutes }
