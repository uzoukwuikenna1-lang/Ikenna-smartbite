# SmartBite FUTO — How the App Was Built (Implementation Guide)

**Project:** SmartBite FUTO — Campus Food Ordering & Delivery System
**Type:** Mobile application (proof of concept)
**Author:** (your name)

This document explains, step by step, how the SmartBite FUTO application was
designed and built. It is written to be dropped into the *Implementation*
chapter of a project report. It covers the technology choices, the system
architecture, the development phases, and how each major feature works.

---

## 1. Overview

SmartBite FUTO is a mobile-based platform that lets students and staff of the
Federal University of Technology, Owerri order food from campus vendors and have
it delivered. It supports **four types of users (roles)**:

| Role | What they do |
|------|--------------|
| **Customer** | Browse vendors, order food, pay, track delivery, rate |
| **Vendor** | Manage their menu, receive and process orders, view sales |
| **Rider** | Pick up ready orders and deliver them, update delivery status |
| **Admin** | Verify vendors, monitor all orders, manage users, view analytics |

The system is built as **one mobile app** (the role is chosen after a splash
screen) talking to **one backend API**, which stores everything in a **MongoDB**
database. Because all roles share the same database, actions by one role appear
to the others in real time (for example, when a student places an order the
vendor immediately sees it, and when the vendor accepts it the student sees the
status change).

---

## 2. Technology Stack

The project brief proposed a stack; during implementation a few pragmatic,
**free-tier / proof-of-concept** choices were made. Both are shown below.

| Layer | Proposed | Used in this build | Reason for any change |
|-------|----------|--------------------|-----------------------|
| Mobile app | React Native | **React Native + Expo (Expo Router) + TypeScript** | Expo speeds up development and testing; TypeScript adds type safety |
| Backend | Node.js + Express | **Node.js + Express + TypeScript** | Same stack, typed for reliability |
| Database | MongoDB | **MongoDB Atlas (free M0 tier)** + in‑memory fallback for local dev | Atlas is free; the in‑memory option lets the API run with zero setup |
| Authentication | JWT | **JWT + bcrypt password hashing** | As proposed |
| Image storage | Cloudinary | **Self‑hosted in MongoDB** | Avoids needing a Cloudinary account; free and self‑contained |
| Maps | Leaflet | **Simulated route card** | Live GPS tracking needs real devices + sockets; simulated for the PoC |
| Payment | Paystack | **Demo Paystack‑style checkout** (no real charge) | A real Paystack integration needs a verified business; the demo mimics the flow |
| Notifications | — | **Expo Push Notifications** | Real device push for order updates |
| Hosting | Render / Railway | **Render (free tier)** | Free; note the free tier sleeps after ~15 min idle |

**Key point for the report:** none of these compromises change what the app
*does* in a demonstration — they simply avoid paid services and hardware that a
proof of concept does not need.

---

## 3. System Architecture

```
┌──────────────────────────┐        HTTPS / JSON        ┌──────────────────────────┐
│      Mobile App           │  ───────────────────────▶ │       Backend API          │
│  (React Native / Expo)    │        (REST, JWT)         │  (Node.js + Express)       │
│                           │  ◀─────────────────────── │                            │
│  4 role interfaces        │                            │  Auth · Orders · Menu ...  │
└──────────────────────────┘                            └────────────┬─────────────┘
                                                                      │ Mongoose
                                                                      ▼
                                                          ┌──────────────────────────┐
                                                          │        MongoDB            │
                                                          │  users, vendors, menu,    │
                                                          │  orders, reviews, images  │
                                                          └──────────────────────────┘
```

- The **app** never talks to the database directly. It calls the **API**, which
  is the only component that touches the database. This keeps prices, roles and
  data validation under server control (a customer cannot, for example, change a
  price by editing the app).
- **Authentication** uses JSON Web Tokens (JWT). After login the app stores a
  token and attaches it to every request; the server checks it and knows who the
  user is and what role they have.
- **Live updates** are achieved with lightweight **polling**: the app re-fetches
  the relevant order list every few seconds, so each role sees the others'
  actions without a manual refresh.

---

## 4. Development Phases

The work was split into clear phases so that each part could be built and tested
before moving on.

### Phase 1 — Customer app (front end, mock data)
Built the whole customer experience against sample data first, so the screens
could be designed and tested without a backend:
- Project setup (Expo Router, TypeScript, a green campus theme, reusable UI
  components: buttons, text fields, screen wrapper).
- Splash screen → role picker → role‑specific login / registration.
- Customer flow: home (vendor list) → vendor menu → cart → checkout → payment →
  order confirmation → live order tracking → order history → ratings.
- Customer settings: edit profile, saved addresses, payment methods,
  notification preferences, favourite vendors.

### Phase 2 — Vendor, Rider and Admin apps (front end, mock data)
- **Vendor dashboard:** order inbox (New / Active / Completed) with
  accept/reject and status updates; menu management (add / edit / delete /
  mark sold‑out); sales and reviews.
- **Rider app:** available deliveries, accept a delivery, and move it through
  *picked up → on the way → delivered*; earnings.
- **Admin console:** dashboard with key numbers and an orders‑by‑status chart;
  verify/suspend vendors; monitor all orders; manage (suspend) users.

### Phase 3 — Backend API
- Set up Express + TypeScript + Mongoose, connected to MongoDB.
- Data models (schemas) for users, vendors, menu items, orders and reviews.
- Authentication (register / login / current user) with hashed passwords and
  JWT.
- Role‑specific endpoints for every action the four apps perform.
- A **mock payment** endpoint and a **database seed** script that fills the
  database with realistic demo data.

### Phase 4 — Integration
- Connected the app to the real API (removed the sample data).
- Wired every screen to the backend and added polling for live updates.
- Added **food photo uploads** (vendors can replace the emoji with a picture).
- Verified the full multi‑role loop end to end.

### Additional features
- **Demo Paystack payment page** — an authentic‑looking card checkout.
- **Expo push notifications** — order alerts to the customer and vendor.

---

## 5. The Mobile App (front end)

### 5.1 Structure
The app uses **Expo Router**, which turns the folder structure into the app's
navigation. Each role has its own folder:

```
src/app/
  index.tsx            → animated splash (routes to the right place)
  role-select.tsx      → choose Customer / Vendor / Rider / Admin
  (auth)/              → login, register, forgot password
  (customer)/          → customer tabs: home, search, cart, orders, profile
  (shop)/              → vendor detail, checkout, order tracking (pushed screens)
  (vendor)/            → vendor tabs: orders, menu, sales, profile
  (rider)/             → rider tabs: available, my deliveries, profile
  (admin)/             → admin tabs: dashboard, vendors, orders, users, profile
  settings/            → customer settings screens
  vendor-item/         → add / edit a menu item
src/api/               → API client, push registration
src/components/        → reusable UI (buttons, cards, thumbnails, Paystack modal)
src/context/store.tsx  → central app state (auth, cart, orders, etc.)
src/data/mock.ts       → shared TypeScript types and helpers
```

### 5.2 State management
All shared state lives in one place — a React **Context** provider
(`src/context/store.tsx`). Screens read and change state through small "hooks"
such as `useAuth`, `useCart`, `useOrders`, `useVendors`, `useMenu` and
`useAdmin`. This keeps screens simple and means the data‑fetching logic is
written once. The store:
- keeps the logged‑in user and JWT (the token is saved on the device so the user
  stays logged in);
- fetches the vendor list, menus and the correct order list for the user's role;
- **polls the order list every 4 seconds** so changes made by other roles show
  up automatically;
- exposes actions (place order, accept order, update status, etc.) that call the
  API and then refresh.

### 5.3 Theming and UI
A single design‑token file defines the colours (a green campus brand with a warm
amber accent), spacing and corner radii, with full light‑ and dark‑mode support.
Reusable components (Button, TextField, Screen, VendorCard, FoodThumb, etc.)
give the app a consistent look.

---

## 6. The Backend API

### 6.1 Structure
```
server/src/
  index.ts            → starts the server (connect DB, seed if needed, listen)
  app.ts              → registers all routes and middleware
  config/             → environment settings and the database connection
  models/             → Mongoose schemas (User, Vendor, MenuItem, Order, Review, Image)
  middleware/         → authentication (JWT), role checks, error handling
  routes/             → one file per area (auth, vendors, orders, rider, admin, ...)
  utils/              → JWT helpers, response presenters, push notifications
  seed.ts             → fills the database with demo data
```

### 6.2 Data models (simplified)
- **User** — name, email, hashed password, role, phone, status; plus embedded
  addresses, saved cards, favourites and notification preferences; a link to the
  vendor they own (for vendors); and their push token.
- **Vendor** — name, tagline, emoji/photo, rating, delivery fee & time,
  categories, open/closed, and a verification status (verified/pending/suspended).
- **MenuItem** — belongs to a vendor: name, description, price, emoji/photo,
  category, popular flag, available flag.
- **Order** — customer, vendor, the list of items (a snapshot of name/price),
  totals, status, delivery address, payment method/reference, and the assigned
  rider.
- **Review** — a customer's rating and comment for a vendor.
- **Image** — an uploaded picture stored as binary data.

### 6.3 Authentication & security
- Passwords are **hashed with bcrypt** before saving — the real password is never
  stored.
- Login returns a **signed JWT**. The app sends it on every request. Middleware
  verifies the token, loads the user, blocks suspended accounts, and makes the
  user's id and role available to the route.
- A `requireRole(...)` guard protects role‑specific routes (e.g. only an admin
  can reach `/api/admin/...`). A customer trying to reach an admin route gets a
  **403 Forbidden**.
- **Prices are recomputed on the server** from the database when an order is
  placed, so a tampered request cannot change what an item costs.

### 6.4 Main endpoints (summary)
- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.
- **Vendors (public):** list, detail, menu, reviews; plus **search**.
- **Vendor (owner):** manage profile, menu CRUD, order inbox, accept/reject/status.
- **Orders (customer):** place, list mine, detail, rate.
- **Rider:** available deliveries, my deliveries, accept, update status.
- **Admin:** stats, verify vendors, monitor orders, manage users.
- **Me:** profile, addresses, cards, notifications, favourites, push token.
- **Payments:** `POST /api/payments/mock-charge` (demo, no real money).
- **Uploads:** `POST /api/uploads` and `GET /api/images/:id` for food photos.

---

## 7. How Key Features Work

### 7.1 The live order loop (the heart of the system)
1. The **customer** places an order → the app calls `POST /api/orders`; the
   server saves it with status *placed* and notifies the vendor.
2. The **vendor's** app is polling `GET /api/vendor/orders`, so the new order
   appears in their "New" tab. They tap **Accept** → status becomes *accepted*.
3. The **customer's** tracking screen is polling `GET /api/orders`, so it updates
   itself to *Vendor accepted* — no refresh needed.
4. The vendor marks the order *preparing* then *ready for pickup*.
5. A **rider** sees it under *Available*, accepts it, and moves it through
   *picked up → on the way → delivered*; each change flows back to the customer.
6. When it is delivered the customer can leave a **rating**, which updates the
   vendor's average.

### 7.2 Payment (demo Paystack)
At checkout the customer picks a payment method. For card payments a
**Paystack‑style popup** appears (logo, email, amount, card number / expiry / CVV,
"Secured by Paystack"). It simulates *processing → success*, then the app creates
the order on the server (recording a payment reference). No real money moves and
no card details are stored — this mirrors the real Paystack flow so it can be
swapped for the live SDK once the business is verified.

### 7.3 Food photos
Vendors can attach a photo to a menu item. The app's image picker sends the
picture to `POST /api/uploads`; the server stores it and returns a URL, which is
saved on the menu item. Everywhere a dish is shown, the app displays the photo,
falling back to an emoji when there is none.

### 7.4 Push notifications
On login the app registers the device's **Expo push token** with the server.
When an order is placed the vendor is notified; when the status changes the
customer is notified (accepted, preparing, on the way, delivered). *(Remote push
requires a physical device and a one‑time `eas init` to obtain a project id.)*

---

## 8. Running the Project

**Backend**
```bash
cd server
npm install
npm start        # uses MongoDB Atlas from server/.env, or an in-memory DB if none
```

**Mobile app**
```bash
npm install
npx expo start   # press w for web, or scan the QR code with Expo Go on a phone
```
On a physical phone, set `EXPO_PUBLIC_API_URL` (in a `.env` file) to your
computer's LAN IP, e.g. `http://192.168.1.20:4000`.

**Demo accounts** (password `demo123`): `chidera@` (customer), `mama@` (vendor),
`emeka@` (rider), `admin@futo.edu.ng`.

---

## 9. Testing

Each phase was verified before moving on:
- **Type checking** (`tsc`) on both the app and the server to catch errors early.
- **API testing** with `curl`: every endpoint, plus security checks (wrong
  password → 401, customer hitting an admin route → 403, tampered prices → 400).
- **End‑to‑end testing** in the browser preview, including the multi‑role loop
  across two windows (customer orders → vendor accepts → customer sees the
  update live).

---

## 10. Limitations and Future Work

Because this is a proof of concept, a few areas are deliberately simplified:
- **Payment** is a demo (no real charge) — replace with the live Paystack SDK.
- **Delivery tracking** uses a simulated route rather than live GPS.
- **Push notifications** need a physical device and an Expo project id to deliver.
- The free hosting tier **sleeps when idle**, so the first request after a pause
  is slow.

Future work: real payments, live map tracking, in‑app chat between customer and
rider, and analytics dashboards for the admin.

---

## 11. Summary

SmartBite FUTO delivers the full scope of the brief: a single mobile app serving
four roles, backed by a secure REST API and a MongoDB database, with real
authentication, a complete order lifecycle that updates live across roles,
food‑photo uploads, a realistic payment flow and order notifications — all built
on free, widely‑used tools suitable for a student project.
