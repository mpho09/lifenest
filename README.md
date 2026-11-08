# LifeNest (MVP)

A private Android app for adults in South Africa to keep important documents, asset details, instructions and an emergency profile in one secure vault, and to release them safely to trusted contacts.

- Product requirements: [docs/PRD_LifeNest_MVP.pdf](docs/PRD_LifeNest_MVP.pdf)
- Build plan (phases, rules, tests): [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- Screen designs: [docs/designs/](docs/designs/) (`S1.png` … `S21.png`, `M1.png` … `M4.png`)

## Stack

Expo SDK 58 (React Native 0.88, React 19.3) with Expo Router and TypeScript (strict), NativeWind, Three.js through React Three Fiber on `expo-gl`, and Supabase (hosted, free plan; no Docker). Tests: Jest + React Native Testing Library, pgTAP, Maestro.

## Prerequisites

- Node.js 22 and npm
- Git
- A free Supabase account with one project called **`lifenest-dev`** (used for development and tests)
- Android Studio with an emulator (OpenGL ES 3), and an Android phone with Expo Go
- Maestro CLI (end-to-end tests)

## Setup

1. Install dependencies:
   ```sh
   npm install
   ```
2. Copy the environment file and fill in your values (never commit `.env`):
   ```sh
   cp .env.example .env
   cp supabase/functions/.env.example supabase/functions/.env
   ```
   - `EXPO_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`: `https://<project-ref>.supabase.co` (Supabase dashboard → Project Settings → API)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: the anon / publishable key (same page)
   - `SUPABASE_SERVICE_ROLE_KEY`: the service role / secret key (same page). **Secret**: only for scripts and tests.
3. Log in to the Supabase CLI and link the dev project (once):
   ```sh
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```
4. Start the app:
   ```sh
   npx expo start
   ```
   Scan the QR code with Expo Go. The 3D scene needs `expo-gl`, which Expo Go includes.

## Commands

| Purpose | Command |
| --- | --- |
| Start the app | `npx expo start` |
| Web preview (browser) | `npm run web` |
| Unit and component tests | `npm test` |
| Database and permission tests (pgTAP, on the linked project) | `npm run test:db` |
| Integration tests (against the linked project) | `npm run test:integration` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |
| **Full check** (run before calling a phase done) | `npm run check` |
| End-to-end tests | `npx expo run:android`, then `maestro test .maestro/` |

Run one test by its ID, for example: `npm test -- -t "T-C-1"`.

## Project layout

See Section 5 of [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). In short: screens in `app/`, shared components in `components/` (3D scenes in `components/three/`), rules and the Supabase client in `lib/`, design tokens in `theme/tokens.ts`, database work in `supabase/`, and tests in `tests/`, `supabase/tests/` and `.maestro/`.

## Security

- Only `EXPO_PUBLIC_` variables may be used in `app/`, `components/` and `lib/`.
- `.env` and `supabase/functions/.env` are git-ignored and must never be committed.

## Web preview on Vercel (Section 18 #28 of the plan)

Android is the main platform. The same app is also built as a static web preview.

- Run it locally: `npm run web`
- Build it: `npm run build:web` (output in `dist/`)

Deploy:

1. Push this repository to GitHub.
2. In Vercel: **Add New → Project →** import the repository. Vercel reads [vercel.json](vercel.json) (install `npm ci`, build `npx expo export --platform web`, output `dist`, all routes go to `index.html`).
3. In **Project Settings → Environment Variables**, add the public values only:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_LINK_BASE_URL`
   Never add `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` to Vercel: everything in the web build is public.
4. Deploy. Each push to the default branch redeploys.

Phone-only features (fingerprint unlock, secure PIN storage, screenshot blocking) do not exist in a browser; how each behaves on web is decided in its phase.
