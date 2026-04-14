import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

const isStorageConfigured = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey)

const supabaseAdmin = isStorageConfigured
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    })
  : null

export {
  isStorageConfigured,
  supabaseAdmin,
}
