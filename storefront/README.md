# Storefront (Landing Page + Gateway)

This app is the public entry point for the logistics platform.

It is responsible for:
- Presenting the marketing landing experience.
- Showing live backend health and snapshot metrics.
- Routing users into the three operational portals:
  - Company dashboard
  - Admin dashboard
  - Driver dashboard

## Local Architecture

- Storefront: http://localhost:5173
- Company dashboard: http://localhost:5174
- Admin dashboard: http://localhost:5175
- Driver dashboard: http://localhost:5176
- Shared backend API: http://localhost:5000

## Environment Variables

Create `.env` in this folder if you want to override defaults.

```env
VITE_API_BASE_URL=/api
VITE_COMPANY_DASHBOARD_URL=http://localhost:5174
VITE_ADMIN_DASHBOARD_URL=http://localhost:5175
VITE_DRIVER_DASHBOARD_URL=http://localhost:5176
```

Defaults are already wired for local development using the ports above.

## Run Locally

1. Install storefront dependencies:

```bash
npm install
```

2. Start the backend (from `backend` folder):

```bash
npm install
npm run dev
```

3. Start each frontend in separate terminals:

```bash
# storefront
cd storefront
npm run dev

# company dashboard
cd ../dashboard
npm install
npm run dev

# admin dashboard
cd ../admin-dashboard/dashboard
npm install
npm run dev

# driver dashboard
cd ../../driver-dashboard
npm install
npm run dev
```

4. Open storefront at:

- http://localhost:5173

Use the "Platform Entry" and role portal buttons to navigate into each dashboard.

## Build

```bash
npm run build
```

## Deploy (Vercel)

This app includes `vercel.json` configured for Vite output.

```bash
npm run build
# then deploy with your normal Vercel workflow
```

For production, set these env vars in Vercel project settings to real URLs:
- `VITE_API_BASE_URL`
- `VITE_COMPANY_DASHBOARD_URL`
- `VITE_ADMIN_DASHBOARD_URL`
- `VITE_DRIVER_DASHBOARD_URL`
