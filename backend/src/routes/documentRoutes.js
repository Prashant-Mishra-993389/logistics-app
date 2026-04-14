import { Router } from 'express'
import multer from 'multer'
import { env } from '../config/env.js'
import { db } from '../lib/db.js'
import {
  ensureShipmentByIdentifier,
  findShipmentByIdentifier,
  isUuid,
} from '../lib/entityResolvers.js'
import { isStorageConfigured, supabaseAdmin } from '../lib/supabase.js'
import { attachUserIfPresent } from '../middleware/requireAuth.js'

const documentRoutes = Router()

documentRoutes.use(attachUserIfPresent)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
})

const cleanText = (value) => String(value ?? '').trim()

const mapDocumentRow = (row) => ({
  id: row.id,
  shipmentId: row.shipment_id,
  uploadedBy: row.uploaded_by,
  storageBucket: row.storage_bucket,
  storagePath: row.storage_path,
  originalName: row.original_name,
  mimeType: row.mime_type,
  sizeBytes: Number(row.size_bytes ?? 0),
  createdAt: row.created_at,
})

const assertBackendsConfigured = (res) => {
  if (!db.isConfigured) {
    res.status(500).json({
      ok: false,
      message: 'Database is not configured. Set DATABASE_URL in backend .env.',
    })
    return false
  }

  if (!isStorageConfigured) {
    res.status(500).json({
      ok: false,
      message: 'Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    })
    return false
  }

  return true
}

const safeFileName = (name) => {
  return String(name ?? 'file.bin').replace(/[^a-zA-Z0-9._-]/g, '_')
}

documentRoutes.post('/documents/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!assertBackendsConfigured(res)) {
      return
    }

    if (!req.file) {
      res.status(400).json({
        ok: false,
        message: 'No file uploaded. Use multipart/form-data with field name file.',
      })
      return
    }

    const shipmentIdentifier = cleanText(req.body?.shipmentId || req.body?.loadId)
    if (!shipmentIdentifier) {
      res.status(400).json({
        ok: false,
        message: 'shipmentId is required.',
      })
      return
    }

    const shipment = await ensureShipmentByIdentifier(shipmentIdentifier)
    if (!shipment) {
      res.status(404).json({
        ok: false,
        message: 'Shipment not found and could not be created.',
      })
      return
    }

    const uploadedByFromBody = cleanText(req.body?.uploadedByUserId)
    const uploadedBy = isUuid(req.user?.id)
      ? req.user.id
      : (isUuid(uploadedByFromBody) ? uploadedByFromBody : null)

    const storagePath = `${shipment.id}/${Date.now()}-${safeFileName(req.file.originalname)}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(env.supabaseStorageBucket)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    const row = await db.one(
      `
      insert into documents (
        shipment_id,
        uploaded_by,
        storage_bucket,
        storage_path,
        original_name,
        mime_type,
        size_bytes
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      returning id, shipment_id, uploaded_by, storage_bucket, storage_path, original_name, mime_type, size_bytes, created_at
      `,
      [
        shipment.id,
        uploadedBy,
        env.supabaseStorageBucket,
        storagePath,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
      ]
    )

    res.status(201).json({
      ok: true,
      document: mapDocumentRow(row),
    })
  } catch (error) {
    next(error)
  }
})

documentRoutes.get('/documents/shipment/:shipmentIdentifier', async (req, res, next) => {
  try {
    if (!assertBackendsConfigured(res)) {
      return
    }

    const shipment = await findShipmentByIdentifier(req.params.shipmentIdentifier)

    if (!shipment) {
      res.json({
        ok: true,
        documents: [],
        total: 0,
      })
      return
    }

    const rows = await db.many(
      `
      select id, shipment_id, uploaded_by, storage_bucket, storage_path, original_name, mime_type, size_bytes, created_at
      from documents
      where shipment_id = $1
      order by created_at desc
      `,
      [shipment.id]
    )

    res.json({
      ok: true,
      documents: rows.map(mapDocumentRow),
      total: rows.length,
    })
  } catch (error) {
    next(error)
  }
})

documentRoutes.get('/documents/:documentId/download-url', async (req, res, next) => {
  try {
    if (!assertBackendsConfigured(res)) {
      return
    }

    const documentId = cleanText(req.params.documentId)
    if (!isUuid(documentId)) {
      res.status(400).json({
        ok: false,
        message: 'Invalid documentId.',
      })
      return
    }

    const row = await db.one(
      `
      select id, shipment_id, uploaded_by, storage_bucket, storage_path, original_name, mime_type, size_bytes, created_at
      from documents
      where id = $1
      limit 1
      `,
      [documentId]
    )

    if (!row) {
      res.status(404).json({
        ok: false,
        message: 'Document not found.',
      })
      return
    }

    const expiresInSeconds = 60 * 15

    const { data, error } = await supabaseAdmin.storage
      .from(row.storage_bucket)
      .createSignedUrl(row.storage_path, expiresInSeconds)

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to create signed URL: ${error?.message ?? 'unknown error'}`)
    }

    res.json({
      ok: true,
      document: mapDocumentRow(row),
      downloadUrl: data.signedUrl,
      expiresInSeconds,
    })
  } catch (error) {
    next(error)
  }
})

export { documentRoutes }
