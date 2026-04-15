# Shared Logistics Backend

This service is a single API for all frontend apps in this workspace:

- `dashboard`
- `admin-dashboard/dashboard`
- `driver-dashboard`
- `storefront` (future API features)

## What This Uses

- Express API server
- Supabase Postgres (structured data)
- Supabase Storage (uploaded documents)
- JWT auth (login/register/me)

Each frontend already calls `/api/*` and proxies to `http://localhost:5000` in development.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
copy .env.example .env
```

3. Add values in `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `SUPABASE_STORAGE_BUCKET`

4. Run migrations:

```bash
npm run db:migrate
```

5. (Optional) Seed demo records:

```bash
npm run seed:demo
```

6. Start the API:

```bash
npm run dev
```

Backend runs on:

- `http://localhost:5000`

## API Endpoints

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Dashboard:

- `GET /api/health`
- `GET /api/dashboard`

Shipments:

- `GET /api/shipments`
- `POST /api/shipments`
- `GET /api/shipments/:shipmentIdentifier`
- `PATCH /api/shipments/:shipmentIdentifier/status`
- `POST /api/shipments/:shipmentIdentifier/assign-driver`
- `GET /api/shipments/:shipmentIdentifier/timeline`

Driver telemetry:

- `POST /api/driver-location`
- `GET /api/driver-location/latest`
- `GET /api/driver-location/history?limit=25`
- `POST /api/driver-message`
- `GET /api/driver-message/latest`
- `GET /api/driver-message/history?limit=25`

Documents:

- `POST /api/documents/upload` (multipart, field `file`)
  - max file size: 10 MB
  - accepted types: PDF and images (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`)
  - returns `413` when file is too large and `415` when file type is unsupported
- `GET /api/documents/shipment/:shipmentIdentifier`
- `GET /api/documents/:documentId/download-url`
  - returns a short-lived signed URL plus `downloadFileName`

## Sample payloads

### Driver location update

```json
{
  "shipmentId": "LOAD-2026-2209",
  "loadId": "LOAD-2026-2209",
  "driver": "Alex Rivera",
  "latitude": 30.2711,
  "longitude": -97.7437,
  "speedMph": 42,
  "recordedAt": "2026-04-14T08:31:00.000Z",
  "source": "current-shipment"
}
```

### Driver message update

```json
{
  "shipmentId": "LOAD-2026-2209",
  "loadId": "LOAD-2026-2209",
  "driver": "Alex Rivera",
  "message": "Delay risk due to traffic near checkpoint 3.",
  "category": "delay",
  "priority": "high",
  "sentAt": "2026-04-14T08:35:00.000Z"
}
```

## Data Sources

- Main dashboard payload is still seed data from:
  - `admin-dashboard/dashboard/server/dashboardData.js`
- Driver-only wallet/POD keys are merged from:
  - `driver-dashboard/server/dashboardData.js`
- Live telemetry writes to Postgres first.
- Runtime JSON fallback remains in:
  - `backend/src/data/runtimeStore.json`

## Supabase Data Flow (Practical View)

When a dashboard user uploads a POD/document:

1. Frontend sends multipart form data to `POST /api/documents/upload`.
2. Backend validates file size/type.
3. File is stored in Supabase Storage bucket (`SUPABASE_STORAGE_BUCKET`, default `documents`).
4. Metadata record is saved in Supabase Postgres table `documents`.
5. Frontend refreshes shipment documents using `GET /api/documents/shipment/:shipmentIdentifier`.

When a user downloads a document:

1. Frontend requests `GET /api/documents/:documentId/download-url`.
2. Backend looks up document metadata in Postgres.
3. Backend creates a signed Storage URL with a safe download filename.
4. Frontend opens that signed URL directly.

How to inspect this in Supabase Studio:

1. Go to Table Editor and open `shipments`, `documents`, `driver_location_events`, `driver_messages`.
2. Go to Storage and open your documents bucket to verify uploaded files.
3. Compare one `documents.storage_path` value with the corresponding file path in Storage.
4. Use SQL Editor to trace one shipment end-to-end:

```sql
select s.shipment_identifier, d.id as document_id, d.file_name, d.storage_path, d.uploaded_at
from shipments s
left join documents d on d.shipment_id = s.id
where s.shipment_identifier = 'LOAD-2026-2209'
order by d.uploaded_at desc;
```

## Demo Users After Seeding

- `admin@logisticsdemo.com` / `admin123`
- `manager@logisticsdemo.com` / `manager123`
- `driver1@logisticsdemo.com` / `driver123`
- `dispatcher@logisticsdemo.com` / `dispatch123`
