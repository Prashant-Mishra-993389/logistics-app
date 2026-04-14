# Schneider Industry Logistics Platform

This project is an Uber-like logistics platform for Schneider Industry, built as a full-stack app with a management dashboard and live operations workflows.

The product model is:
- Shipper requests load pickup and delivery
- System matches and dispatches available drivers and vehicles
- Operations team tracks routes, exceptions, billing, and proof of delivery

Primary roles:
- Admin / Company Manager (current dashboard focus)
- Dispatcher / Operations Team
- Driver (mobile-first workflow, can be a separate app surface)

## Stack

- Frontend: React 19, Vite, Tailwind CSS
- Backend: Node.js, Express
- Maps: Google Maps JavaScript API via `@react-google-maps/api`

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start frontend and backend together:

```bash
npm run dev
```

3. Open:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/dashboard`

## Scripts

- `npm run dev`: Runs Vite client and Node server in parallel
- `npm run dev:client`: Runs React app only
- `npm run dev:server`: Runs Express API only
- `npm run build`: Builds frontend for production
- `npm run server`: Starts backend without nodemon

## Environment

Google Maps key is read from:

- `.env.local` -> `VITE_GOOGLE_MAPS_API_KEY`
