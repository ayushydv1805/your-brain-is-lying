# Your Brain Is Lying 🧠

A fast, arcade-style brain-training app built with React and Vite. Play five short cognitive challenges, track practice over time, and optionally sync progress or compete with friends using Supabase.


## Download for Windows or Android

The repository builds a Windows installer, a Windows portable EXE and an Android APK from the same app source.

- **[Windows Setup EXE — direct download](https://github.com/ayushydv1805/your-brain-is-lying/releases/latest/download/Your-Brain-Is-Lying-Setup.exe)**
- **[Windows Portable EXE — direct download](https://github.com/ayushydv1805/your-brain-is-lying/releases/latest/download/Your-Brain-Is-Lying-Portable.exe)**
- **[Android APK — direct download](https://github.com/ayushydv1805/your-brain-is-lying/releases/latest/download/Your-Brain-Is-Lying-Android.apk)**
- [All releases and previous builds](https://github.com/ayushydv1805/your-brain-is-lying/releases/latest)
- [Installation notes and known signing limits](DOWNLOADS.md)

These links become available after the GitHub Actions **Build PC and Android downloads** workflow has successfully built both platforms and published its release assets. The Windows EXE is currently unsigned, so SmartScreen may show a warning. The Android APK is debug-signed for sideload installation; it is not a Play Store package. See DOWNLOADS.md for notes on future APK updates and backups.


## What is in the app

- **Five playable challenges:** Reaction, Memory, Attention, Logic and Impulse Control.
- **Adaptive difficulty:** each skill tracks its own mastery and adjusts challenge difficulty without changing the shared XP level.
- **Progression:** XP, levels, personal bests, streaks, daily challenge, achievements and recent run history.
- **Insight tools:** Brain Report, Performance Lab, a deterministic Brain Coach, training plans and weekly reports.
- **Brain Passport:** share a small, read-only progress snapshot or export a passport card without publishing run history.
- **Review and accessibility:** round-by-round mistake review, reduced motion, higher contrast, larger text and simplified decoration.
- **Progress portability:** JSON backup and restore.
- **Optional social features:** Supabase accounts, cross-device progress sync, friend requests, head-to-head challenges and opt-in leaderboards.
- **Installable web app:** add it to a supported device's home screen; the shell and visited game assets can be cached for offline local play.

Brain-game results are practice metrics inside this app. They are not a medical, diagnostic or formal intelligence assessment.

## Run locally

Use Node.js 22 or newer, then run:

~~~bash
npm ci
npm run dev
~~~

The local profile flow works without cloud credentials. Run the release checks before pushing:

~~~bash
npm run check
~~~

`npm run check` runs the automated test suite and a production Vite build. `npm run build` creates the deployable `dist/` directory; `npm run preview` serves that build locally.

## Deploy to Vercel

The repository includes `vercel.json` with the Vite build/output settings, reproducible `npm ci` install, SPA fallback, security headers and long-lived caching for hashed assets. Import `ayushydv1805/your-brain-is-lying` in Vercel or keep the existing Git integration connected to `main`.

Recommended release checklist:

1. Confirm the GitHub Actions **Build** workflow passes on the commit you intend to ship.
2. Use `npm ci` and `npm run check` locally or in CI.
3. Set Vercel's production branch to `main` and use `dist` as the output directory.
4. For a publicly accessible site, review Vercel Deployment Protection; preview URLs may require sign-in even when the build succeeds.
5. Configure the Supabase backend before advertising online accounts, sync or social features as available.

The app is usable in local-profile mode without Supabase, but local progress belongs to that browser/device. Do not describe cloud features as active until the backend setup below is complete.

## Optional cloud accounts, progress sync and social features

Phase C/D uses Supabase Auth and Postgres. **The SQL schema is included but is not automatically applied to any database.** Use a dedicated Supabase project for this app; do not point it at a different production app's database.

1. Open the dedicated Supabase project's SQL Editor and run the full file `supabase/phase-c-d-schema.sql`.
2. Enable email/password authentication. Set the Site URL and allowed Redirect URLs to your actual development and production origins so email-confirmation and reset links return to the app.
3. In the Supabase API settings, copy the project URL and **publishable key** (or the legacy anon key). Never put the `service_role` or another secret key in a browser/mobile build.
4. Copy `.env.example` to `.env` and set:

~~~env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_WITH_YOUR_KEY
~~~

5. Add the same two variables in Vercel Project Settings → Environment Variables for **Production** and **Preview** as appropriate, then redeploy.
6. Confirm `public` is included in the Supabase Data API's exposed schemas if your project uses a restricted exposed-schema list. Keep RLS enabled on all app tables.
7. Test with two separate accounts: confirmation, sign-in, password reset, profile handle, progress sync across two browsers, friend request, accept/decline, challenge scoring, leaderboard opt-in and sign-out.

Without both Vite variables the app intentionally uses local-profile mode. It does not ship with database credentials. Keep `.env` out of Git; only the public client key belongs in the browser.

### Cloud leaderboard limitation

The browser submits challenge and leaderboard scores. This is suitable for friendly competition, but a modified client can falsify scores. Do not use these rankings for cash prizes, paid tournaments, admissions, employment or other high-stakes decisions without server-side score verification and rate limiting.

## Data and privacy notes

- Local-mode passwords are verified in the browser and are not cloud credentials. Treat this mode as a convenience profile, not as a secure cross-device identity system.
- Local progress is saved in browser storage. Export a backup before clearing site data or changing devices.
- Cloud mode uses Supabase Auth; only the publishable client key is intended to be shipped to the browser. Private progress is protected by Row Level Security in the supplied schema.
- Brain Coach recommendations are deterministic rules over saved results. The app does not send those results to a generative-AI service.
- Shared Brain Passport URLs contain the selected summary, not the full raw run history or test answers. Review the preview before sharing.

## Troubleshooting

**I only see local sign-in.** Check that both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set, then restart Vite or redeploy.

**Cloud login reports missing tables.** Run `supabase/phase-c-d-schema.sql` in the correct Supabase project and confirm the `public` schema is exposed through the Data API.

**Email confirmation or password reset does not return to the app.** Add the exact Vercel production URL and any development URL to Supabase Auth's allowed Redirect URLs.

**Vercel preview asks me to sign in.** Check Deployment Protection in Vercel. That restriction is separate from the Vite build and app authentication.

**Progress is missing on another device.** Local mode does not sync. Cloud mode needs the Supabase schema and environment variables, a confirmed account and a working internet connection.

**Offline mode cannot load a game after installation.** Open the app online once so the service worker can cache the shell and assets. Cloud authentication and social features still require a connection.

## Repository checks

- GitHub Actions runs the automated Node test suite, then the production build on pushes and pull requests.
- `src/game/*.test.js` covers training/report calculations, input validation, progress merging, score normalization and deployment/PWA configuration.
- Production source maps are disabled; the public client still contains the JavaScript needed to run the app, but no separate `.map` files are emitted.

## Tech stack

React 19 · Vite 7 · Supabase JS · Supabase Auth/Postgres (optional) · Node's built-in test runner · Vercel static hosting.
