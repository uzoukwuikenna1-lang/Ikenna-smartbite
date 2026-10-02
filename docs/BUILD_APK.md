# Building the SmartBite FUTO Android APK (for testing on a phone)

The project is already configured for an APK build (see `eas.json` and `app.json`).
You just need a **free Expo account** and a few commands. The build runs in Expo's
cloud (~10–15 min) and gives you a downloadable `.apk` to install on any Android
phone.

> The APK talks to the backend over the network, so the phone must be able to
> reach your backend. Do **Step 1** first.

---

## Step 1 — Make the backend reachable, then point the app at it

Pick ONE option and set `EXPO_PUBLIC_API_URL` in **`eas.json`** (under the
`preview` profile → `env`).

**Option A — Deploy the backend to Render (recommended; works anywhere)**
1. Push this repo to GitHub.
2. On render.com: **New → Web Service** → pick the repo → **Root Directory:** `server`.
3. Build command `npm install`, Start command `npm start`.
4. Add environment variables: `MONGODB_URI` (your Atlas URI), `JWT_SECRET`, `CORS_ORIGIN=*`.
5. Deploy, then copy the URL (e.g. `https://smartbite-api.onrender.com`).
6. In `eas.json`, set `"EXPO_PUBLIC_API_URL": "https://smartbite-api.onrender.com"`.

**Option B — Run the backend on your laptop (same Wi‑Fi only)**
1. `cd server && npm start` (leave it running).
2. Find your laptop's LAN IP: macOS `ipconfig getifaddr en0`, Windows `ipconfig`.
3. In `eas.json`, set `"EXPO_PUBLIC_API_URL": "http://<LAN-IP>:4000"` (cleartext
   HTTP is already allowed in the APK). The phone must be on the same Wi‑Fi.

---

## Step 2 — One-time setup

```bash
# From the project root
npm install -g eas-cli        # or use: npx eas-cli@latest ...
eas login                     # create a free account at expo.dev if you don't have one
eas init                      # links the project and writes your EAS projectId into app.json
```

`eas init` also enables push notifications in the built app (it sets the project id
the app needs to get a push token).

---

## Step 3 — Build the APK

```bash
eas build --platform android --profile preview
```

- Wait for the cloud build to finish (~10–15 min). It prints a link.
- Open the link (or the QR code) on your phone and **download the APK**, or grab
  it from your builds list at **expo.dev → your project → Builds**.

---

## Step 4 — Install on the phone

1. On the Android phone, open the APK you downloaded.
2. If prompted, allow **“Install from unknown sources”** for your browser/files app.
3. Open **SmartBite FUTO** and log in.

**Demo accounts** (password `demo123`):
`chidera@futo.edu.ng` (customer) · `mama@futo.edu.ng` (vendor) ·
`emeka@futo.edu.ng` (rider) · `admin@futo.edu.ng` (admin).

To show the live loop with your testers: have one person order as the customer and
another accept it as the vendor — the customer's screen updates on its own.

---

## Notes & troubleshooting

- **“Network error” in the app** → the backend isn't reachable. Check
  `EXPO_PUBLIC_API_URL`, that the server is running, and (Option B) that the phone
  is on the same Wi‑Fi.
- **Render free tier sleeps** after ~15 min idle; the first request wakes it (~30s).
- **Notifications** are on-device (local) and appear while the app is open — the
  customer sees order status changes, the vendor sees new orders, etc. They need
  no Firebase. (Background push when the app is fully closed would need Firebase
  Cloud Messaging — free, but not set up in this build.) Grant the notification
  permission prompt on first launch.
- **iOS** uses the same setup with `--platform ios`, but installing on an iPhone
  needs the device registered on an Apple developer account; Android APK is the
  simplest for testers.
- To rebuild after changes, bump `android.versionCode` in `app.json` and run the
  build command again.
