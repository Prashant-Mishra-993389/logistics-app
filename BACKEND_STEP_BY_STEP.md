# Backend Step-by-Step Plan (Beginner Friendly)

This guide reflects the current project state after Supabase integration.

## 1) What Is Already Done

- Single shared backend exists at `backend`
- Supabase Postgres integration is implemented
- Supabase Storage integration is implemented for document upload/download
- JWT auth is implemented
- Shipment APIs are implemented
- Driver telemetry writes to Postgres (with JSON fallback)

## 2) Backend API Routes Available Now

Health and dashboard:

- `GET /api/health`
- `GET /api/dashboard`

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

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
- `GET /api/driver-location/history`
- `POST /api/driver-message`
- `GET /api/driver-message/latest`
- `GET /api/driver-message/history`

Documents:

- `POST /api/documents/upload`
- `GET /api/documents/shipment/:shipmentIdentifier`
- `GET /api/documents/:documentId/download-url`

## 3) One-Time Local Setup

From workspace root:

```bash
cd backend
npm install
copy .env.example .env
```

Fill `backend/.env` with:

- `DATABASE_URL` (Supabase transaction pooler URI)
- `JWT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (default `shipment-documents`)

Run database migration and seed data:

```bash
npm run db:migrate
npm run seed:demo
```

## 4) Run Backend + Frontends Locally

Backend:

```bash
npm --prefix backend run dev
```

Frontends (run separately):

```bash
npm --prefix admin-dashboard/dashboard run dev:client
npm --prefix dashboard run dev:client
npm --prefix driver-dashboard run dev:client
npm --prefix storefront run dev
```

## 5) Demo Login Accounts

- `admin@logisticsdemo.com` / `admin123`
- `manager@logisticsdemo.com` / `manager123`
- `driver1@logisticsdemo.com` / `driver123`
- `dispatcher@logisticsdemo.com` / `dispatch123`

## 6) Deployment Plan (Teacher Link Ready)

Do in this order:

1. Push code to GitHub
2. Deploy backend folder on Render
3. Add backend env vars on Render
4. Deploy frontend apps on Vercel
5. Set each frontend API base/proxy target to Render backend URL
6. Smoke-test login, shipment list, location update, message send, document upload and download

## 7) Mission Checklist Before Submission

- Health endpoint responds from deployed backend
- Login works for demo users
- Shipment list loads from Postgres
- Driver location and message updates appear in timeline
- Document upload returns success
- Download URL opens file correctly
- Data persists after service restart
