# Hyu

Native iOS/Android + web app combining **nutrition tracking** (calorie + macro logging) and a **strength training logger** (workouts, e1RM, PR detection), plus **friendly challenges**. One Expo + React Native codebase ships to the App Store, Google Play, and the web (Vercel).

> The app name is **Hyu** (pronounced "hew" — to sculpt/chisel) with bundle id `com.hyu.app`. To rename, edit the constants at the top of [`app.config.ts`](app.config.ts).

## Stack

- **Expo (managed) + React Native + TypeScript**, file-based routing via **Expo Router**
- **Supabase** — Postgres, Auth (email magic link + password), Row Level Security on every table; session persisted with `expo-secure-store` (native) / `AsyncStorage` (web)
- **NativeWind** (Tailwind for RN) for styling
- **USDA FoodData Central** for food data, proxied through a Supabase **Edge Function** so the API key stays server-side
- Web target via React Native Web → deploy to **Vercel**

## Build status

| Step | Status |
| --- | --- |
| 1. Scaffold (Expo Router + NativeWind + Supabase + SecureStore) | ✅ |
| 2. Schema + RLS + exercise seed + FDC edge function | ✅ |
| 3. Auth (magic link + password) + protected routes | ✅ |
| 4–13 (nutrition, fast-logging, barcode, strength, HealthKit, notifications, social/challenges, web deploy, App Store prep) | ⏳ |

---

## 1. Prerequisites

- Node 20+ (tested on Node 24) and npm
- A [Supabase](https://supabase.com) project (free tier is fine)
- A free [USDA FoodData Central API key](https://fdc.nal.usda.gov/api-key-signup.html) (server-side only)
- The [Supabase CLI](https://supabase.com/docs/guides/cli) (`npx supabase` works; no global install needed)
- For native builds: an [Expo](https://expo.dev) account and EAS CLI (added in a later step)

## 2. Environment variables

Copy the example file and fill in your project's **client-safe** values:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Both are safe to ship in the client bundle — every table is protected by RLS. **Never** put the `service_role` key or the USDA key in `.env`; those stay server-side (see step 4).

## 3. Install & apply the database schema

```bash
npm install
```

The full schema, RLS policies, and ~60-exercise seed live in a single migration: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

**Apply it** one of two ways:

- **Dashboard (quickest):** open your project's **SQL Editor**, paste the contents of `0001_init.sql`, and run it.
- **CLI (repeatable):**
  ```bash
  npx supabase link --project-ref YOUR_PROJECT_REF   # asks for your DB password
  npx supabase db push
  ```

A new user automatically gets a `profiles` row and a default `goals` row (via the `handle_new_user` trigger).

## 4. Deploy the USDA FDC proxy (Edge Function)

The function in [`supabase/functions/fdc-search`](supabase/functions/fdc-search/index.ts) keeps your USDA key server-side and normalizes results to Hyu's per-100g food shape.

```bash
npx supabase secrets set USDA_FDC_API_KEY=your_usda_key
npx supabase functions deploy fdc-search
```

It requires a valid Supabase JWT, so only signed-in users can call it.

## 5. Run locally

**Web (primary testing surface):**
```bash
npm run web
```

**Native (Expo Go for most things; a dev build is required later for HealthKit/camera):**
```bash
npm start         # then press i / a, or scan the QR with Expo Go
```

Auth email links redirect back to the app via the `hyu://` scheme (configure your Supabase Auth redirect URLs to include it, plus your web URL, under **Authentication → URL Configuration**).

## 6. Typecheck

```bash
npm run typecheck
```

---

## Cross-platform notes

The web build is first-class. Native-only modules degrade gracefully:
- **HealthKit** and **barcode scanning** are hidden on web (added in later steps).
- **Notifications/haptics** no-op on web.

## Project layout

```
app/                    Expo Router routes
  _layout.tsx           root: providers + auth-gated stack
  (auth)/               sign-in / sign-up (redirects out when authed)
  (app)/                protected tabs (redirects to sign-in when not authed)
components/             shared UI
lib/
  supabase.ts           Supabase client + SecureStore session adapter
  auth.tsx              AuthProvider (password, magic link, session restore)
  types.ts              domain types mirroring the schema
supabase/
  migrations/           SQL schema + RLS + seed
  functions/fdc-search/ USDA FoodData Central proxy
```

## App Store launch checklist

_Filled in at step 13. In brief: enroll in the Apple Developer Program ($99/yr), create the App Store Connect record matching the bundle id, configure EAS Submit, provide HealthKit + camera usage strings (already in `app.config.ts`), complete the App Privacy questionnaire (declare health/dietary data; **not** used for tracking/ads), host a privacy policy URL, and ship via TestFlight before review._
