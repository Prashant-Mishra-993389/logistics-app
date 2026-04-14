# Manifest Drives (Vite + React)

This project runs on Vite + React frontend and an Express backend API for bookings, driver actions, live tracking, pricing, and Google Maps route support.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Add your Google Maps API key in `.env`:

```env
GOOGLE_MAPS_API_KEY=YOUR_KEY
VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY
```

## Run Full App

1. Start backend API:

```bash
npm run server
```

2. In a separate terminal, start frontend:

```bash
npm run dev
```

Frontend is typically available at `http://localhost:5173`.
Backend is typically available at `http://localhost:5000`.

## Demo Logins

Manager:

- Email: `manager@drivergo.com`
- Password: `admin123`

Driver:

- Email: `driver1@drivergo.com`
- Password: `driver123`

## Company Booking Flow (How It Works)

When a company user fills pickup, drop, truck type, and weight in the dashboard:

1. Frontend calls `POST /api/dashboard/quote`.
2. Backend geocodes pickup/drop and computes route distance + duration.
3. Backend calculates price using:
	 - base fare
	 - distance charge
	 - weight charge
	 - truck type multiplier
4. Backend finds nearby available drivers for the requested truck type.
5. Frontend shows price + nearby drivers before creating shipment.
6. On create (`POST /api/dashboard/bookings`), booking is saved and visible to drivers.

## Nearby Driver Matching Logic

- Driver location source:
	- active booking location if driver is already on a run
	- otherwise driver base city coordinates
- Availability filter:
	- drivers with `assigned` or `in_transit` bookings are treated as busy
- Truck compatibility:
	- `Mini` request -> `Mini`/`LCV`/`HCV`
	- `LCV` request -> `LCV`/`HCV`
	- `HCV` request -> `HCV`
- Results are sorted by distance to pickup and returned with ETA to pickup.

## Seed Demo Database Data

This project uses `data/store.json` as the runtime database.

Create additional sample company and driver accounts:

```bash
npm run seed:demo
```

This seeds:

- 2 company manager accounts
- 3 additional drivers across different cities/truck sizes

## Sample Test Cases

1. Start backend + frontend.
2. Login as manager (`manager@drivergo.com` / `admin123`).
3. In quick shipment form, enter:
	 - Pickup: `Mumbai`
	 - Drop: `Pune`
	 - Weight: `650`
	 - Truck: `LCV`
4. Click **Check Price & Drivers** and verify:
	 - estimated price appears
	 - nearby driver list appears
5. Click **Create Shipment**.
6. Login as driver (`driver1@drivergo.com` / `driver123`) and accept job.
7. Update status + location and confirm manager sees tracking updates and map.

Run API smoke test:

```bash
node scripts/e2e-manager-driver-smoke.mjs
```

## Development

```bash
npm run dev
```

The app will be available at the local URL shown in the terminal (typically `http://localhost:5173`).

## Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```
