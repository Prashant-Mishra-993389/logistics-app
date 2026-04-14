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
- `GET /api/documents/shipment/:shipmentIdentifier`
- `GET /api/documents/:documentId/download-url`

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

## Demo Users After Seeding

- `admin@logisticsdemo.com` / `admin123`
- `manager@logisticsdemo.com` / `manager123`
- `driver1@logisticsdemo.com` / `driver123`
- `dispatcher@logisticsdemo.com` / `dispatch123`
