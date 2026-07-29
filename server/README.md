# SmartBite FUTO — Backend API

Node + Express + TypeScript + MongoDB (Mongoose) + JWT. Powers all four roles of
the SmartBite mobile app (customer, vendor, rider, admin).

## Quick start (zero setup)

```bash
cd server
npm install
npm start
```

With no `MONGODB_URI` set, the server spins up an **in-memory MongoDB** and seeds
demo data automatically, then listens on `http://localhost:4000`.

**Demo accounts** (password `demo123` for all):

| Role     | Email                  |
|----------|------------------------|
| Customer | chidera@futo.edu.ng    |
| Vendor   | mama@futo.edu.ng       |
| Rider    | emeka@futo.edu.ng      |
| Admin    | admin@futo.edu.ng      |

## Using a real database (MongoDB Atlas — free M0)

1. Create a free cluster at mongodb.com/atlas and copy its connection string.
2. `cp .env.example .env`, set `MONGODB_URI=...` and a strong `JWT_SECRET`.
3. Seed once: `npm run seed`
4. Run: `npm start`

## Scripts

- `npm start` — run the API (`tsx src/index.ts`)
- `npm run dev` — run with auto-reload
- `npm run seed` — (re)seed the database
- `npm run typecheck` — TypeScript check

## API overview

Base URL: `/api`. Send `Authorization: Bearer <token>` after login.

- **Auth** — `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password`
- **Vendors (public)** — `GET /vendors`, `GET /vendors/:id`, `GET /vendors/:id/menu`, `GET /vendors/:id/reviews`
- **Vendor (role: vendor)** — `GET/PATCH /vendor/me`, `GET/POST /vendor/menu`, `PATCH/DELETE /vendor/menu/:id`, `GET /vendor/orders`, `PATCH /vendor/orders/:id/{accept,reject,status}`
- **Orders (role: customer)** — `POST /orders`, `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/rate`
- **Rider (role: rider)** — `GET /rider/available`, `GET /rider/deliveries`, `PATCH /rider/orders/:id/{accept,status}`
- **Admin (role: admin)** — `GET /admin/stats`, `GET /admin/vendors`, `PATCH /admin/vendors/:id/verification`, `GET /admin/orders`, `GET /admin/users`, `PATCH /admin/users/:id/status`
- **Me / settings** — `PATCH /me`, addresses / cards / notifications / favourites
- **Payments (mock)** — `POST /payments/mock-charge` (no real money moves)

## Deploy to Render (free tier)

1. Push the repo to GitHub.
2. New → Web Service → pick the repo, set **Root Directory** to `server`.
3. Build command: `npm install` · Start command: `npm start`
4. Add env vars: `MONGODB_URI` (Atlas), `JWT_SECRET`, `CORS_ORIGIN`.
5. Deploy. Note: the free tier sleeps after ~15 min idle (first request wakes it, ~30s).
