# SmartBite FUTO — download site

A static landing page where people can read about the app and download the Android APK.
It mirrors the app's design language (colours, Spline Sans, rounded cards) from
`src/constants/theme.ts`.

```
web/
├── index.html          # the page
├── styles.css          # theme + layout (light & dark)
├── netlify.toml        # publish dir + APK download headers
├── favicon.png
├── assets/icon-512.png # app icon / logo
└── downloads/
    └── smartbite-futo.apk   # the build (git-ignored — see below)
```

## The APK is not in Git

The APK is ~126 MB, over GitHub's 100 MB per-file limit, so `web/downloads/*.apk`
is git-ignored. Rebuild/replace it before deploying:

```bash
cp /path/to/your-latest-build.apk web/downloads/smartbite-futo.apk
```

(The download link in `index.html` points at `downloads/smartbite-futo.apk`.)

## Deploy

**Option A — Netlify Drop (simplest, includes the APK):**
Go to https://app.netlify.com/drop and drag the whole `web/` folder in. Because
you're uploading the folder directly, the git-ignored APK is included.

**Option B — Netlify from GitHub:**
Connect the repo, set **base directory** to `web` and **publish directory** to `web`.
Git deploys will **not** include the APK (it's git-ignored), so host the APK
separately — the easy route is a **GitHub Release**:

1. Create a release, attach `smartbite-futo.apk` (Releases allow up to 2 GB/file).
2. Copy the asset URL and replace both `href="downloads/smartbite-futo.apk"` links
   in `index.html` with it.

**Local preview:**
```bash
cd web && python3 -m http.server 8090   # then open http://localhost:8090
```

## Updating for a new app version

1. Drop the new `.apk` into `web/downloads/smartbite-futo.apk`.
2. Bump the version text in `index.html` (search for `v1.0.0`).
3. Re-deploy.
